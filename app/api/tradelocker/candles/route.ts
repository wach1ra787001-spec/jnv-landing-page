import { createClient } from '@/lib/supabase/server'
import { decryptTradeLockerToken } from '@/lib/tradelocker-crypto'
import { NextRequest, NextResponse } from 'next/server'

const LIVE_API_BASE = 'https://live.tradelocker.com/backend-api'
const DEMO_API_BASE = 'https://demo.tradelocker.com/backend-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const params = request.nextUrl.searchParams
    const tradeId = params.get('tradeId')
    const resolution = params.get('resolution') || '60'
    const from = Number(params.get('from'))
    const to = Number(params.get('to'))
    if (!tradeId || !Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
      return NextResponse.json({ error: 'tradeId, from, and to are required' }, { status: 400 })
    }

    const { data: trade } = await supabase.from('trades').select('symbol, direction, entry_price, exit_price, entry_time, exit_time, stop_loss, take_profit, broker_connection_id, account_id').eq('id', tradeId).eq('user_id', user.id).maybeSingle()
    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

    let connectionId = trade.broker_connection_id
    if (!connectionId && trade.account_id) {
      const { data: account } = await supabase.from('accounts').select('broker_connection_id').eq('id', trade.account_id).eq('user_id', user.id).maybeSingle()
      connectionId = account?.broker_connection_id
    }
    const { data: connection } = await supabase.from('broker_connections').select('encrypted_access_token, tradelocker_account_id, account_login, tradelocker_server').eq('id', connectionId).eq('user_id', user.id).eq('broker', 'tradelocker').eq('is_connected', true).maybeSingle()
    if (!connection) return NextResponse.json({ error: 'No connected TradeLocker account for this trade' }, { status: 409 })

    const apiBase = process.env.TRADELOCKER_API_BASE || (connection.tradelocker_server?.toLowerCase().includes('demo') ? DEMO_API_BASE : LIVE_API_BASE)
    const accessToken = decryptTradeLockerToken(connection.encrypted_access_token)
    const upstream = new URL(`${apiBase}/trade/history`)
    upstream.searchParams.set('symbol', trade.symbol)
    upstream.searchParams.set('resolution', resolution)
    upstream.searchParams.set('from', String(Math.floor(from)))
    upstream.searchParams.set('to', String(Math.floor(to)))
    const response = await fetch(upstream, { headers: { Authorization: `Bearer ${accessToken}`, accNum: String(connection.account_login || connection.tradelocker_account_id) }, cache: 'no-store', signal: AbortSignal.timeout(15000) })
    const payload = await response.json().catch(() => null)
    if (!response.ok) return NextResponse.json({ error: payload?.message || `TradeLocker candle request failed (${response.status})` }, { status: 502 })
    return NextResponse.json({ ...payload, trade: { symbol: trade.symbol, direction: trade.direction, entryPrice: trade.entry_price, exitPrice: trade.exit_price, entryTime: trade.entry_time, exitTime: trade.exit_time, stopLoss: trade.stop_loss, takeProfit: trade.take_profit } })
  } catch (error) {
    console.error('[v0] TradeLocker candle request failed:', error)
    return NextResponse.json({ error: 'Failed to fetch TradeLocker candles' }, { status: 500 })
  }
}
