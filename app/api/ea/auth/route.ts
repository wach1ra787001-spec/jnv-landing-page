import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Expected API key from environment
const EXPECTED_EA_API_KEY = process.env.MT5_EA_API_KEY || 'your-shared-secret-here'

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      ea_api_key,
      jnv_user_id,
      account_login,
      account_server,
      broker,
      terminal_build,
      ea_version,
      currency,
      terminal_id,
    } = body

    // Validate API key
    if (ea_api_key !== EXPECTED_EA_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Invalid EA API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Find or create MT5 connection
    const { data: existingConnection } = await supabase
      .from('mt5_connections')
      .select('*')
      .eq('account_login', account_login)
      .eq('terminal_id', terminal_id)
      .single()

    let connectionId = existingConnection?.id

    if (!existingConnection) {
      // Create new connection
      const { data: newConnection, error: insertError } = await supabase
        .from('mt5_connections')
        .insert({
          account_login,
          terminal_id,
          broker_name: broker,
          server_name: account_server,
          account_server,
          terminal_build,
          ea_version,
          currency,
          api_key_hash: hashApiKey(ea_api_key),
          connection_token: generateToken(),
          is_active: true,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error creating MT5 connection:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create connection' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      connectionId = newConnection.id
    }

    // Generate session token (expires in 1 hour)
    const token = generateToken(32)
    const expiresIn = 3600 // 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Create session
    const { error: sessionError } = await supabase
      .from('mt5_sessions')
      .insert({
        connection_id: connectionId,
        token,
        expires_at: expiresAt,
      })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update last heartbeat
    await supabase
      .from('mt5_connections')
      .update({ last_event_at: new Date().toISOString() })
      .eq('id', connectionId)

    return new Response(
      JSON.stringify({
        token,
        expires_in: expiresIn,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
