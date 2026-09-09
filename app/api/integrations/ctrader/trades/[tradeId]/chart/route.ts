import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTrendbars, normalizeCTraderTrendbars } from '@/lib/ctrader'

const PERIODS: Record<string, string> = { '1m': 'M1', '5m': 'M5', '15m': 'M15', '30m': 'M30', '1h': 'H1', '4h': 'H4', '1d': 'D1' }

export async function GET(request: NextRequest, { params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const timeframe = request.nextUrl.searchParams.get('timeframe') || '15m'
  const period = PERIODS[timeframe]
  if (!period) return NextResponse.json({ error: 'Unsupported timeframe' }, { status: 400 })

  const { data: trade, error: tradeError } = await supabase.from('trades').select('*').eq('id', tradeId).eq('user_id', user.id).eq('source', 'ctrader').single()
  if (tradeError || !trade) return NextResponse.json({ error: 'cTrader trade not found' }, { status: 404 })
  const { data: connection } = await supabase.from('broker_connections').select('*').eq('user_id', user.id).eq('broker', 'ctrader').eq('status', 'connected').limit(1).maybeSingle()
  if (!connection?.access_token || !connection?.account_id) return NextResponse.json({ error: 'Connected cTrader account not found' }, { status: 404 })

  const entryTimestamp = Math.floor(new Date(trade.entry_time).getTime() / 1000)
  const exitTimestamp = Math.floor(new Date(trade.exit_time || trade.entry_time).getTime() / 1000)
  const duration = Math.max(exitTimestamp - entryTimestamp, 3600)
  const from = entryTimestamp - Math.max(Math.floor(duration * 0.2), 3600)
  const to = exitTimestamp + Math.max(Math.floor(duration * 0.2), 3600)
  const symbolId = Number(trade.raw_payload?.symbolId || trade.raw_payload?.symbol_id)
  if (!Number.isFinite(symbolId)) return NextResponse.json({ error: 'cTrader symbol metadata is unavailable for this trade' }, { status: 422 })

  try {
    const trendbars = await fetchTrendbars(connection.access_token, String(connection.account_id), { symbolId, period, from: from * 1000, to: to * 1000 })
    const digits = Number(trade.raw_payload?.digits ?? trade.raw_payload?.symbolDigits ?? 5)
    const candles = normalizeCTraderTrendbars(trendbars, digits)
    if (!candles.length) return NextResponse.json({ error: 'No historical cTrader chart data is available' }, { status: 404 })
    return NextResponse.json({ trade: { id: trade.id, symbol: trade.symbol, direction: trade.direction, entry: { timestamp: entryTimestamp, price: Number(trade.entry_price) }, exit: trade.exit_time ? { timestamp: exitTimestamp, price: Number(trade.exit_price) } : null, entryTime: entryTimestamp, entryPrice: Number(trade.entry_price), exitTime: trade.exit_time ? exitTimestamp : null, exitPrice: trade.exit_time ? Number(trade.exit_price) : null, stopLoss: trade.stop_loss, takeProfit: trade.take_profit }, candles })
  } catch (error) {
    console.error('[v0] cTrader chart request failed:', error)
    return NextResponse.json({ error: 'Unable to retrieve historical cTrader chart data' }, { status: 502 })
  }
}
