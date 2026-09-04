import { createClient } from '@/lib/supabase/server'
import { encryptTradeLockerToken } from '@/lib/tradelocker-crypto'
import { NextResponse } from 'next/server'

const API_BASE = 'https://live.tradelocker.com/backend-api'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const server = typeof body.server === 'string' ? body.server.trim() : ''
  if (!email || !password || !server) {
    return NextResponse.json({ error: 'Email, password, and server are required' }, { status: 400 })
  }

  try {
    const maskedEmail = email.length > 3 ? `${email.slice(0, 2)}…${email.slice(-1)}` : '***'
    console.log('[v0] TradeLocker JWT request', {
      endpoint: `${API_BASE}/auth/jwt/token`,
      environment: API_BASE.includes('demo') ? 'demo' : 'live',
      email: maskedEmail,
      passwordPresent: password.length > 0,
      passwordLength: password.length,
      server,
      payloadKeys: ['email', 'password', 'server'],
    })
    const response = await fetch(`${API_BASE}/auth/jwt/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, server }),
      cache: 'no-store',
    })
    const result = await response.json().catch(() => null)
    console.log('[v0] TradeLocker JWT response', {
      status: response.status,
      ok: response.ok,
      responseKeys: result && typeof result === 'object' ? Object.keys(result) : [],
      code: result?.code ?? result?.errorCode ?? null,
      message: typeof result?.message === 'string' ? result.message : null,
    })
    if (!response.ok || !result?.accessToken || !result?.refreshToken) {
      return NextResponse.json({ error: result?.message || 'TradeLocker authentication failed', diagnostic: { status: response.status, environment: API_BASE.includes('demo') ? 'demo' : 'live', server } }, { status: 401 })
    }

    const accountsResponse = await fetch(`${API_BASE}/auth/jwt/all-accounts`, {
      headers: { Authorization: `Bearer ${result.accessToken}` },
      cache: 'no-store',
    })
    const accounts = await accountsResponse.json().catch(() => null)
    if (!accountsResponse.ok) {
      return NextResponse.json({ error: 'Unable to retrieve TradeLocker accounts' }, { status: 502 })
    }

    const expiresAt = result.expireDate ? new Date(result.expireDate).toISOString() : null
    const rows = Array.isArray(accounts) ? accounts : accounts?.accounts || []
    for (const account of rows) {
      const accountId = Number(account.accNum ?? account.accountId ?? account.id)
      if (!Number.isFinite(accountId)) continue
      const { error } = await supabase.from('broker_connections').upsert({
        user_id: user.id,
        broker: 'tradelocker',
        tradelocker_account_id: accountId,
        selected_account_id: accountId,
        tradelocker_server: server,
        encrypted_access_token: encryptTradeLockerToken(result.accessToken),
        encrypted_refresh_token: encryptTradeLockerToken(result.refreshToken),
        token_expires_at: expiresAt,
        account_login: String(account.login ?? accountId),
        account_name: account.name ?? null,
        broker_name: account.broker ?? server,
        is_connected: true,
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,broker,tradelocker_account_id' })
      if (error) throw error
    }

    return NextResponse.json({ accounts: rows.map((account: any) => ({
      id: Number(account.accNum ?? account.accountId ?? account.id),
      name: account.name ?? account.login ?? 'TradeLocker account',
    })) })
  } catch (error) {
    console.error('[TradeLocker auth]', error)
    return NextResponse.json({ error: 'TradeLocker connection failed' }, { status: 502 })
  }
}
