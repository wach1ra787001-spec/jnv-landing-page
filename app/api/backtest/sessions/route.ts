import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('backtest_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, symbol, timeframe, date_from, date_to, initial_balance, description, strategy_name } = body

  if (!name || !symbol || !initial_balance) {
    return NextResponse.json({ error: 'Missing required fields: name, symbol, initial_balance' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('backtest_sessions')
    .insert({
      user_id: user.id,
      name,
      strategy_name: strategy_name || name,   // NOT NULL — fallback to session name
      symbol: symbol.replace(/[\/\-\s]/g, '').toUpperCase(),
      timeframe: timeframe || 'H1',
      date_from: date_from || null,
      date_to: date_to || null,
      initial_balance: Number(initial_balance),
      final_balance: Number(initial_balance),
      status: 'running',
      subscription_tier: 'free',
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      breakeven_trades: 0,
      win_rate_pct: 0,
      total_net_pnl: 0,
      description: description || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[backtest/sessions POST] insert error:', error)
    return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
