import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: session_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { direction, entry_price, exit_price, lot_size, entry_time, exit_time, stop_loss, take_profit, notes } = body

  const isPending = exit_price == null
  if (!['buy', 'sell'].includes(direction) || !Number.isFinite(Number(entry_price)) || !Number.isFinite(Number(lot_size))) {
    return NextResponse.json({ error: 'Direction, entry price, and lot size are required.' }, { status: 400 })
  }
  if (isPending && (!Number.isFinite(Number(stop_loss)) || !Number.isFinite(Number(take_profit)))) {
    return NextResponse.json({ error: 'Pending backtest trades require stop loss and take profit.' }, { status: 400 })
  }
  const pnl = isPending ? 0 : direction === 'buy'
    ? (exit_price - entry_price) * lot_size * 100000
    : (entry_price - exit_price) * lot_size * 100000

  // Fetch session for balance tracking
  const { data: session } = await supabase
    .from('backtest_sessions')
    .select('final_balance, total_trades, winning_trades, losing_trades, total_net_pnl')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const balance_before = session.final_balance
  const balance_after = isPending ? balance_before : balance_before + pnl
  const trade_number = (session.total_trades ?? 0) + 1
  const net_pnl = isPending ? 0 : pnl
  const status = isPending ? 'open' : pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven'

  const { data: trade, error } = await supabase
    .from('backtest_trades')
    .insert({
      user_id: user.id,
      session_id,
      trade_number,
      symbol: body.symbol,
      direction,
      entry_price,
      exit_price,
      lot_size,
      entry_time,
      exit_time,
      stop_loss,
      take_profit,
      pnl,
      net_pnl,
      balance_before,
      balance_after,
      status,
      notes,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recompute session stats
  const { data: allTrades } = await supabase
    .from('backtest_trades')
    .select('net_pnl, status')
    .eq('session_id', session_id)

  const wins = allTrades?.filter(t => t.status === 'win').length ?? 0
  const losses = allTrades?.filter(t => t.status === 'loss').length ?? 0
  const closedTrades = allTrades?.filter(t => t.status !== 'open') ?? []
  const total = closedTrades.length
  const total_net_pnl = closedTrades.reduce((s, t) => s + (t.net_pnl ?? 0), 0)
  const win_rate_pct = total > 0 ? (wins / total) * 100 : 0

  await supabase.from('backtest_sessions').update({
    final_balance: balance_after,
    total_trades: total,
    winning_trades: wins,
    losing_trades: losses,
    total_net_pnl,
    win_rate_pct,
    updated_at: new Date().toISOString(),
  }).eq('id', session_id).eq('user_id', user.id)

  return NextResponse.json(trade, { status: 201 })
}
