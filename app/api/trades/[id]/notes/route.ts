import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[v0] Fetching notes for trade ID:', id)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[v0] User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] User authenticated:', user.id)

    // Verify user owns this trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (tradeError) {
      console.error('[v0] Trade verification error:', tradeError)
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    if (!trade) {
      console.log('[v0] Trade not found for user')
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    console.log('[v0] Trade verified, fetching notes for trade_id:', id)

    // Get notes for this trade (filter by both trade_id and user_id for security)
    const { data: notes, error } = await supabase
      .from('trade_notes')
      .select('id, note, created_at, user_id, trade_id')
      .eq('trade_id', id)
      .eq('user_id', user.id)  // ✅ Double-check user ownership
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[v0] Fetch notes error:', error)
      return NextResponse.json({ error: 'Failed to fetch notes', details: error.message }, { status: 500 })
    }

    console.log('[v0] Notes fetched successfully:', notes?.length || 0)
    return NextResponse.json(notes || [])
  } catch (error) {
    console.error('[v0] Get trade notes error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[v0] Adding note for trade ID:', id)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[v0] User not authenticated for note POST')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { note } = await request.json()

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      console.log('[v0] Invalid note content')
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    // Verify user owns this trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (tradeError) {
      console.error('[v0] Trade verification error:', tradeError)
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    if (!trade) {
      console.log('[v0] Trade not found for user')
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    console.log('[v0] Trade verified, inserting note with trade_id:', id, 'user_id:', user.id)

    // Validate trade_id is not empty
    if (!id || id.trim().length === 0) {
      console.error('[v0] ERROR: trade_id is empty or null!', { id })
      return NextResponse.json({ error: 'Invalid trade ID' }, { status: 400 })
    }

    console.log('[v0] Inserting note - verified trade_id is valid:', id)

    // Insert new note with BOTH user_id and trade_id
    const insertPayload = {
      user_id: user.id,  // ✅ Authenticated user's ID
      trade_id: id,      // ✅ The trade this note belongs to
      note: note.trim(),
    }
    
    console.log('[v0] Inserting note:', { note_preview: note.substring(0, 50) + '...', user_id: user.id, trade_id: id })

    const { data, error } = await supabase
      .from('trade_notes')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('[v0] Create note error:', error.message)
      console.error('[v0] Full error:', error)
      // Return a properly formatted JSON error response
      return NextResponse.json(
        { error: 'Failed to create note', details: error.message || String(error) },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('[v0] Note created successfully:', data?.id)
    return NextResponse.json(data, { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('[v0] Create trade note error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
