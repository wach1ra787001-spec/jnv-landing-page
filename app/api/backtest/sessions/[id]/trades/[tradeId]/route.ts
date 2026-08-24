import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; tradeId: string }> }) {
  const { id: session_id, tradeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const exit_price = Number(body.exit_price)
  if (!Number.isFinite(exit_price)) return NextResponse.json({ error: 'A valid exit price is required.' }, { status: 400 })
  const { data: trade } = await supabase.from('backtest_trades').select('*').eq('id', tradeId).eq('session_id', session_id).eq('user_id', user.id).single()
  if (!trade || trade.status !== 'open') return NextResponse.json({ error: 'Open trade not found.' }, { status: 404 })
  const pnl = trade.direction === 'buy' ? (exit_price - trade.entry_price) * trade.lot_size * 100000 : (trade.entry_price - exit_price) * trade.lot_size * 100000
  const balance_after = Number(trade.balance_before) + pnl
  const status = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven'
  const { data: updated, error } = await supabase.from('backtest_trades').update({ exit_price, exit_time: body.exit_time || new Date().toISOString(), pnl, net_pnl: pnl, balance_after, status }).eq('id', tradeId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: all } = await supabase.from('backtest_trades').select('net_pnl,status').eq('session_id', session_id).neq('status', 'open')
  const wins = all?.filter(t => t.status === 'win').length ?? 0
  const total = all?.length ?? 0
  await supabase.from('backtest_sessions').update({ final_balance: balance_after, total_trades: total, winning_trades: wins, losing_trades: all?.filter(t => t.status === 'loss').length ?? 0, total_net_pnl: all?.reduce((sum, t) => sum + Number(t.net_pnl || 0), 0) ?? 0, win_rate_pct: total ? wins / total * 100 : 0, updated_at: new Date().toISOString() }).eq('id', session_id).eq('user_id', user.id)
  return NextResponse.json(updated)
}
