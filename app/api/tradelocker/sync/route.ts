import { createClient } from '@/lib/supabase/server'
import { decryptTradeLockerToken, encryptTradeLockerToken } from '@/lib/tradelocker-crypto'
import { NextResponse } from 'next/server'

const LIVE_API_BASE = 'https://live.tradelocker.com/backend-api'
const DEMO_API_BASE = 'https://demo.tradelocker.com/backend-api'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: connections, error } = await supabase.from('broker_connections').select('*').eq('user_id', user.id).eq('broker', 'tradelocker').eq('is_connected', true)
  const connection = (connections || []).find((item: any) => item.tradelocker_account_id === item.selected_account_id)
  const accountEnvironment = connection?.tradelocker_server?.toLowerCase().includes('demo') ? 'demo' : 'live'
  const apiBase = accountEnvironment === 'demo' ? DEMO_API_BASE : (process.env.TRADELOCKER_API_BASE || LIVE_API_BASE)
  if (error || !connection) return NextResponse.json({ error: 'No selected TradeLocker account' }, { status: 404 })
  if (!connection.encrypted_access_token || !connection.tradelocker_account_id) return NextResponse.json({ error: 'TradeLocker connection is incomplete' }, { status: 400 })

  try {
    let accessToken = decryptTradeLockerToken(connection.encrypted_access_token)
    if (connection.token_expires_at && new Date(connection.token_expires_at) <= new Date()) {
      const refreshToken = connection.encrypted_refresh_token ? decryptTradeLockerToken(connection.encrypted_refresh_token) : ''
      const refreshResponse = await fetch(`${apiBase}/auth/jwt/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }), cache: 'no-store' })
      const refreshed = await refreshResponse.json().catch(() => null)
      if (!refreshResponse.ok || !refreshed?.accessToken) throw new Error('TradeLocker authentication expired')
      accessToken = refreshed.accessToken
      await supabase.from('broker_connections').update({ encrypted_access_token: encryptTradeLockerToken(accessToken), encrypted_refresh_token: refreshed.refreshToken ? encryptTradeLockerToken(refreshed.refreshToken) : connection.encrypted_refresh_token, token_expires_at: refreshed.expireDate ? new Date(refreshed.expireDate).toISOString() : null }).eq('id', connection.id)
    }

    const response = await fetch(`${apiBase}/trade/accounts/${connection.tradelocker_account_id}/ordersHistory`, { headers: { Authorization: `Bearer ${accessToken}`, accNum: String(connection.tradelocker_account_id) }, cache: 'no-store' })
    const payload = await response.json().catch(() => null)
    if (!response.ok) throw new Error(payload?.message || `TradeLocker API error (${response.status})`)
    const orders = payload?.orders || payload?.data || []
    const { data: accountRow } = await supabase.from('accounts').select('id').eq('user_id', user.id).eq('broker_connection_id', connection.id).maybeSingle()
    const { data: existing } = await supabase.from('trades').select('raw_payload, account_id').eq('user_id', user.id).eq('source', 'tradelocker').eq('account_id', accountRow?.id || '')
    const known = new Set((existing || []).flatMap((trade: any) => {
      const payload = trade.raw_payload || {}
      const providerId = payload.orderId ?? payload.orderID ?? payload.id ?? payload.dealId
      return providerId == null ? [] : [String(providerId)]
    }))
    const trades = orders.filter((order: any) => {
      const providerId = order.orderId ?? order.orderID ?? order.id ?? order.dealId
      if (providerId == null) return false
      return !known.has(String(providerId))
    }).map((order: any) => ({ user_id: user.id, account_id: accountRow?.id || null, source: 'tradelocker', symbol: String(order.symbol ?? order.instrument ?? 'UNKNOWN').toUpperCase(), direction: String(order.side ?? '').toUpperCase() === 'SELL' ? 'short' : 'long', entry_price: Number(order.price ?? order.openPrice ?? 0), exit_price: Number(order.closePrice ?? order.price ?? 0) || null, quantity: Number(order.quantity ?? order.volume ?? 0), entry_time: order.openTime ?? order.createTime ?? new Date().toISOString(), exit_time: order.closeTime ?? order.updateTime ?? new Date().toISOString(), pnl: Number(order.profit ?? order.pnl ?? 0), status: 'closed', raw_payload: { ...order, _tradeLockerAccountId: connection.tradelocker_account_id, _tradeLockerServer: connection.tradelocker_server } }))
    if (trades.length) { const { error: insertError } = await supabase.from('trades').insert(trades); if (insertError) throw insertError }
    await supabase.from('broker_connections').update({ last_synced_at: new Date().toISOString(), last_sync_error: null }).eq('id', connection.id)
    return NextResponse.json({ imported: trades.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TradeLocker sync failed'
    await supabase.from('broker_connections').update({ last_sync_error: message, is_connected: !message.includes('expired') }).eq('id', connection.id)
    return NextResponse.json({ error: message }, { status: message.includes('expired') ? 401 : 502 })
  }
}
