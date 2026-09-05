import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyToken(token: string): Promise<{ connectionId: string; userId: string } | null> {
  try {
    const { data: session } = await supabase
      .from('mt5_sessions')
      .select('connection_id, mt5_connections(id, user_id)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!session) return null

    const connection = session.mt5_connections as any
    return {
      connectionId: session.connection_id,
      userId: connection.user_id,
    }
  } catch (error) {
    return null
  }
}

export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    const auth = await verifyToken(token)

    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse envelope
    const envelope = await request.json()

    const {
      seq,
      event_type,
      terminal_id,
      account_login,
      sent_at,
      payload,
    } = envelope

    // Validate required fields
    if (!seq || !event_type || !account_login) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Insert raw event with deduplication (account_login, seq)
    const { data: event, error: insertError } = await supabase
      .from('mt5_events')
      .insert({
        seq,
        event_type,
        jnv_user_id: auth.userId,
        terminal_id,
        account_login,
        sent_at,
        payload,
        user_id: auth.userId,
      })
      .select('id')
      .single()

    // Deduplication: if seq already exists for this account_login, it's a no-op
    if (insertError?.code === '23505') {
      // Unique constraint violated - this is expected for retries
      console.log(`Duplicate event deduped: seq=${seq}, account_login=${account_login}`)
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Event already received' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (insertError && insertError.code !== '23505') {
      console.error('Error inserting event:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store event' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update connection last event timestamp
    await supabase
      .from('mt5_connections')
      .update({ last_event_at: new Date().toISOString() })
      .eq('id', auth.connectionId)

    // Queue event for async processing based on event type
    // (actual processing happens in background workers)
    if (event_type === 'heartbeat') {
      // Update last heartbeat
      await supabase
        .from('mt5_connections')
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq('id', auth.connectionId)
    }

    return new Response(
      JSON.stringify({ 
        status: 'ok',
        event_id: event?.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Events endpoint error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
