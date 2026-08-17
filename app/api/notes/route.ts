import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch trade-linked notes from the journal view (rich trade data)
    const { data: tradeNotes, error: tradeErr } = await supabase
      .from('trades_with_journal')
      .select('id, symbol, direction, net_pnl, status, entry_time, post_trade_notes, tags, created_at')
      .eq('user_id', user.id)
      .not('post_trade_notes', 'is', null)
      .order('entry_time', { ascending: false })

    if (tradeErr) {
      console.error('[v0] Error fetching trade notes:', tradeErr)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    // Fetch standalone notes created via the notes editor
    const { data: standaloneNotes, error: standaloneErr } = await supabase
      .from('trade_notes')
      .select('id, user_id, trade_id, note, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (standaloneErr) {
      console.error('[v0] Error fetching standalone notes:', standaloneErr)
    }

    // Merge: trade notes first (they have richer data), then standalone-only notes
    const tradeIds = new Set((tradeNotes ?? []).map((n: any) => n.id))
    const standalone = (standaloneNotes ?? [])
      .filter((n: any) => !tradeIds.has(n.id))
      .map((n: any) => ({
        id: n.id,
        note: n.note,
        body: n.note,
        created_at: n.created_at,
        trade_id: n.trade_id,
      }))

    const combined = [...(tradeNotes ?? []), ...standalone]

    return NextResponse.json(combined)
  } catch (error) {
    console.error('[v0] Notes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { note, trade_id } = body

    if (!note) {
      return NextResponse.json({ error: 'Note body is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('trade_notes')
      .insert([{
        user_id: user.id,
        trade_id: trade_id && trade_id !== 'standalone' ? trade_id : null,
        note,
      }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating note:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
