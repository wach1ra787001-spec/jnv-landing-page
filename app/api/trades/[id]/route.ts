import { createClient } from '@/lib/supabase/server'
import { generateSignedBlobUrls } from '@/lib/blob-signed-url'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (id.startsWith('missed-')) {
      const { data: missed, error: missedError } = await supabase.from('missed_trades').select('*').eq('id', id.slice(7)).eq('user_id', user.id).single()
      if (missedError) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
      return NextResponse.json({ ...missed, id, missed: true, strategy: missed.strategy, notes: missed.premarket_notes })
    }

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Generate signed URLs for private blob screenshots
    if (data.screenshot_urls && data.screenshot_urls.length > 0) {
      try {
        console.log('[v0] Generating signed URLs for', data.screenshot_urls.length, 'screenshots server-side')
        data.screenshot_urls = await generateSignedBlobUrls(data.screenshot_urls)
        console.log('[v0] Signed URLs generated successfully')
      } catch (err) {
        console.error('[v0] Error generating signed URLs, returning original URLs:', err)
        // Fallback: return original URLs if signing fails
      }
    }

    // 'trades' has no 'notes' column - the latest note lives in the
    // separate 'trade_notes' table. Attach it so the edit form can prefill.
    const { data: latestNote } = await supabase
      .from('trade_notes')
      .select('note')
      .eq('trade_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ ...data, notes: latestNote?.note || '' })
  } catch (error) {
    console.error('Fetch trade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Build update object with only allowed fields
    const updateData: Record<string, any> = {}
    
    // Note: 'notes' and 'emotion_before' are intentionally NOT columns on the
    // 'trades' table (writing them causes a PGRST204 "column not found"
    // error). Notes live in the separate 'trade_notes' table and are handled
    // below; emotion_before has no persistence target in the current schema.
    const allowedFields = [
      'symbol', 'direction', 'entry_price', 'exit_price', 
      'stop_loss', 'take_profit', 'quantity', 'entry_time', 
      'exit_time', 'pnl', 'pnl_percent', 'net_pnl', 'commission', 'swap', 'r_multiple', 
      'risk_amount', 'strategy', 'setup_type', 'followed_rules', 'followed_rule_ids',
      'status', 'screenshot_urls', 'playbook_rules_snapshot',
      'playbook_name', 'playbook_version',
    ]
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // net_pnl drives the dashboard, account balance, and every analytics view.
    // If the caller updated gross pnl but didn't explicitly send net_pnl,
    // keep it in sync instead of letting it drift or stay null.
    if (body.pnl !== undefined && body.net_pnl === undefined) {
      updateData.net_pnl = body.pnl
    }

    if (Object.keys(updateData).length === 0 && typeof body.notes !== 'string') {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    let data: any = null
    if (Object.keys(updateData).length > 0) {
      const { data: updated, error } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Update trade error:', error)
        return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
      }
      data = updated
    } else {
      const { data: existing, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      if (error) {
        console.error('Fetch trade error:', error)
        return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
      }
      data = existing
    }

    // Notes live in 'trade_notes', keyed by trade_id, not on 'trades' itself.
    // Keep the latest note in sync with what the form submitted: update the
    // most recent note if one exists, otherwise create the first one.
    if (typeof body.notes === 'string') {
      const trimmedNotes = body.notes.trim()
      const { data: existingNotes, error: notesFetchError } = await supabase
        .from('trade_notes')
        .select('id')
        .eq('trade_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (notesFetchError) {
        console.error('Fetch trade notes error:', notesFetchError)
      } else if (trimmedNotes) {
        if (existingNotes && existingNotes.length > 0) {
          const { error: noteUpdateError } = await supabase
            .from('trade_notes')
            .update({ note: trimmedNotes })
            .eq('id', existingNotes[0].id)
            .eq('user_id', user.id)
          if (noteUpdateError) console.error('Update trade note error:', noteUpdateError)
        } else {
          const { error: noteInsertError } = await supabase
            .from('trade_notes')
            .insert({ user_id: user.id, trade_id: id, note: trimmedNotes })
          if (noteInsertError) console.error('Insert trade note error:', noteInsertError)
        }
      } else if (existingNotes && existingNotes.length > 0) {
        // Notes field was cleared out - remove the stale note.
        const { error: noteDeleteError } = await supabase
          .from('trade_notes')
          .delete()
          .eq('id', existingNotes[0].id)
          .eq('user_id', user.id)
        if (noteDeleteError) console.error('Delete trade note error:', noteDeleteError)
      }
    }

    return NextResponse.json({ ...data, notes: body.notes ?? undefined })
  } catch (error) {
    console.error('Update trade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete trade error:', error)
      return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete trade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
