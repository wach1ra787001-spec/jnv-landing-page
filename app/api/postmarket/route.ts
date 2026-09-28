import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const booleanFields = ['over_risking', 'revenge_trading', 'overtrading', 'early_entry', 'early_exit', 'moved_sl', 'moved_tp', 'followed_plan', 'protected_capital', 'session_completed']
const numericFields = ['energy_level', 'stress_level', 'number_of_trades', 'total_pnl', 'total_r', 'max_drawdown', 'biggest_winning_trade', 'biggest_losing_trade', 'session_rating']

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.trading_date || !body.session_traded) return NextResponse.json({ error: 'Trading date and session are required' }, { status: 400 })
  const payload: Record<string, unknown> = { user_id: user.id }
  for (const key of [...booleanFields, ...numericFields, 'trading_date', 'session_traded', 'overall_mood', 'win_loss_result', 'planned_vs_taken', 'outside_plan', 'rule_violations', 'missed_valid_setups', 'emotional_decisions', 'best_decision', 'biggest_mistake', 'what_worked', 'what_did_not_work', 'lesson_learned', 'improve_tomorrow', 'screenshot_url']) {
    if (body[key] !== undefined && body[key] !== '') payload[key] = booleanFields.includes(key) ? Boolean(body[key]) : numericFields.includes(key) ? Number(body[key]) : String(body[key]).trim()
  }
  payload.completed_at = payload.session_completed ? new Date().toISOString() : null
  const { data: routine, error } = await supabase.from('postmarket_routines').insert(payload).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (body.trade_id) await supabase.from('postmarket_trade_links').insert({ routine_id: routine.id, trade_id: body.trade_id })
  return NextResponse.json({ routine })
}
