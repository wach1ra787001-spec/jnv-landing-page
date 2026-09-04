import { createClient } from '@/lib/supabase/server'
import { encryptTradeLockerToken } from '@/lib/tradelocker-crypto'
import { NextResponse } from 'next/server'

const LIVE_API_BASE = 'https://live.tradelocker.com/backend-api'
const DEMO_API_BASE = 'https://demo.tradelocker.com/backend-api'
const CONFIGURED_API_BASE = process.env.TRADELOCKER_API_BASE || LIVE_API_BASE

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
    const apiBases = CONFIGURED_API_BASE === DEMO_API_BASE ? [DEMO_API_BASE, LIVE_API_BASE] : [CONFIGURED_API_BASE, DEMO_API_BASE]
    let apiBase = apiBases[0]
    let response: Response | null = null
    let result: any = null
    let lastFailure: { status: number; statusText: string; environment: string; responseKeys: string[]; code: unknown; message: string | null } | null = null

    for (const candidateBase of apiBases) {
      const environment = candidateBase === DEMO_API_BASE ? 'demo' : 'live'
      console.log('[v0] TradeLocker JWT request', { endpoint: `${candidateBase}/auth/jwt/token`, environment, email: maskedEmail, passwordPresent: password.length > 0, passwordLength: password.length, server, payloadKeys: ['email', 'password', 'server'] })
      try {
        const candidateResponse = await fetch(`${candidateBase}/auth/jwt/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, server }),
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        })
        const responseText = await candidateResponse.text()
        let candidateResult: any = null
        try { candidateResult = responseText ? JSON.parse(responseText) : null } catch { candidateResult = null }
        const failure = { status: candidateResponse.status, statusText: candidateResponse.statusText, environment, responseKeys: candidateResult && typeof candidateResult === 'object' ? Object.keys(candidateResult) : [], code: candidateResult?.code ?? candidateResult?.errorCode ?? null, message: typeof candidateResult?.message === 'string' ? candidateResult.message : null }
        console.log('[v0] TradeLocker JWT response', { ...failure, ok: candidateResponse.ok })
        if (candidateResponse.ok && candidateResult?.accessToken && candidateResult?.refreshToken) {
          apiBase = candidateBase
          response = candidateResponse
          result = candidateResult
          break
        }
        lastFailure = failure
      } catch (requestError) {
        const reason = requestError instanceof Error ? requestError.message : 'Unknown network error'
        console.error('[v0] TradeLocker JWT network failure', { environment, server, reason })
        lastFailure = { status: 0, statusText: reason, environment, responseKeys: [], code: null, message: reason }
      }
    }

    if (!response || !result?.accessToken || !result?.refreshToken) {
      return NextResponse.json({ error: lastFailure?.message || 'TradeLocker authentication failed', diagnostic: lastFailure }, { status: lastFailure?.status ? 401 : 502 })
    }

    const accountsResponse = await fetch(`${apiBase}/auth/jwt/all-accounts`, {
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
