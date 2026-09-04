import { createClient } from '@/lib/supabase/server'
import { encryptTradeLockerToken } from '@/lib/tradelocker-crypto'
import { NextResponse } from 'next/server'

const API_BASE = process.env.TRADELOCKER_API_BASE || 'https://live.tradelocker.com/backend-api'
const API_ENVIRONMENT = API_BASE.includes('demo') ? 'demo' : 'live'

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
      environment: API_ENVIRONMENT,
      email: maskedEmail,
      passwordPresent: password.length > 0,
      passwordLength: password.length,
      server,
      payloadKeys: ['email', 'password', 'server'],
    })
    let response: Response
    try {
      response = await fetch(`${API_BASE}/auth/jwt/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, server }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      })
    } catch (requestError) {
      const reason = requestError instanceof Error ? requestError.message : 'Unknown network error'
      console.error('[v0] TradeLocker JWT network failure', { environment: API_ENVIRONMENT, server, reason })
      return NextResponse.json({ error: `TradeLocker API request failed (${reason})`, diagnostic: { environment: API_ENVIRONMENT, server } }, { status: 502 })
    }
    const responseText = await response.text()
    let result: any = null
    try { result = responseText ? JSON.parse(responseText) : null } catch { result = null }
    console.log('[v0] TradeLocker JWT response', {
      status: response.status,
      ok: response.ok,
      responseKeys: result && typeof result === 'object' ? Object.keys(result) : [],
      code: result?.code ?? result?.errorCode ?? null,
      message: typeof result?.message === 'string' ? result.message : null,
    })
    if (!response.ok || !result?.accessToken || !result?.refreshToken) {
      return NextResponse.json({ error: result?.message || `TradeLocker authentication failed (HTTP ${response.status})`, diagnostic: { status: response.status, statusText: response.statusText, environment: API_ENVIRONMENT, server, responseKeys: result && typeof result === 'object' ? Object.keys(result) : [], code: result?.code ?? result?.errorCode ?? null } }, { status: 401 })
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
      const tradeLockerAccountId = Number(account.accountId ?? account.id ?? account.accNum)
      const brokerLogin = account.accNum ?? account.login ?? null
      if (!Number.isFinite(tradeLockerAccountId)) continue
      const connectionData = {
        user_id: user.id,
        broker: 'tradelocker',
        tradelocker_account_id: tradeLockerAccountId,
        selected_account_id: tradeLockerAccountId,
        tradelocker_server: server,
        encrypted_access_token: encryptTradeLockerToken(result.accessToken),
        encrypted_refresh_token: encryptTradeLockerToken(result.refreshToken),
        token_expires_at: expiresAt,
        account_login: brokerLogin ? String(brokerLogin) : String(tradeLockerAccountId),
        account_name: account.name ?? null,
        broker_name: account.broker ?? server,
        is_connected: true,
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      }
      const { data: existingConnection, error: lookupError } = await supabase
        .from('broker_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('broker', 'tradelocker')
        .eq('tradelocker_account_id', tradeLockerAccountId)
        .maybeSingle()
      if (lookupError) throw lookupError
      const { error: saveError } = existingConnection
        ? await supabase.from('broker_connections').update(connectionData).eq('id', existingConnection.id)
        : await supabase.from('broker_connections').insert(connectionData)
      if (saveError) throw saveError
      const { data: connection } = await supabase
        .from('broker_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('broker', 'tradelocker')
        .eq('tradelocker_account_id', tradeLockerAccountId)
        .maybeSingle()
      if (!connection) throw new Error('TradeLocker connection was not persisted')

      const accountName = account.name ?? `TradeLocker ${brokerLogin ? `#${brokerLogin}` : `#${tradeLockerAccountId}`}`
      const accountRecord = {
        user_id: user.id,
        account_name: accountName,
        account_type: 'TradeLocker',
        broker_connection_id: connection.id,
        currency: account.currency ?? 'USD',
        initial_balance: account.balance ?? account.initialBalance ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('broker_connection_id', connection.id)
        .maybeSingle()
      const accountSave = existingAccount
        ? await supabase.from('accounts').update(accountRecord).eq('id', existingAccount.id).select().single()
        : await supabase.from('accounts').insert(accountRecord).select().single()
      if (accountSave.error) throw accountSave.error
    }

    return NextResponse.json({ accounts: rows.map((account: any) => ({
      id: Number(account.accountId ?? account.id ?? account.accNum),
      brokerLogin: account.accNum ?? account.login ?? null,
      name: account.name ?? account.login ?? 'TradeLocker account',
    })) })
  } catch (error) {
    console.error('[TradeLocker auth]', error)
    return NextResponse.json({ error: 'TradeLocker connection failed' }, { status: 502 })
  }
}
