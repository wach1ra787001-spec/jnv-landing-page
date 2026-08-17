import { Database } from '@/types/supabase'

type Trade = Database['public']['Tables']['trades']['Row']

export interface CalculatedMetrics {
  total_trades: number
  total_profit_loss: number
  win_rate: number
  winning_trades: number
  losing_trades: number
  avg_win: number
  avg_loss: number
  profit_factor: number
  monthly_growth: number
  growth_vs_last_month: number
  avg_trades_per_day: number
  risk_exposure: number
  current_streak: number
}

export function calculateMetricsFromTrades(trades: Trade[]): CalculatedMetrics {
  if (!trades || trades.length === 0) {
    return {
      total_trades: 0,
      total_profit_loss: 0,
      win_rate: 0,
      winning_trades: 0,
      losing_trades: 0,
      avg_win: 0,
      avg_loss: 0,
      profit_factor: 0,
      monthly_growth: 0,
      growth_vs_last_month: 0,
      avg_trades_per_day: 0,
      risk_exposure: 0,
      current_streak: 0,
    }
  }

  // Filter closed trades - use pnl field from database
  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== null)
  const total_trades = closedTrades.length
  
  let total_profit_loss = 0
  let winning_trades = 0
  let losing_trades = 0
  let total_win = 0
  let total_loss = 0
  let current_streak = 0
  let streak_type: 'win' | 'loss' | null = null

  // Calculate PnL and streak
  closedTrades.forEach((trade) => {
    const pnl = trade.pnl || 0
    total_profit_loss += pnl

    if (pnl > 0) {
      winning_trades += 1
      total_win += pnl
      
      if (streak_type === 'win') {
        current_streak += 1
      } else {
        current_streak = 1
        streak_type = 'win'
      }
    } else if (pnl < 0) {
      losing_trades += 1
      total_loss += Math.abs(pnl)
      
      if (streak_type === 'loss') {
        current_streak += 1
      } else {
        current_streak = 1
        streak_type = 'loss'
      }
    }
  })

  // Calculate averages
  const avg_win = winning_trades > 0 ? total_win / winning_trades : 0
  const avg_loss = losing_trades > 0 ? total_loss / losing_trades : 0
  const win_rate = total_trades > 0 ? (winning_trades / total_trades) * 100 : 0
  const profit_factor = total_loss > 0 ? total_win / total_loss : total_win > 0 ? Infinity : 0

  // Calculate daily metrics
  const tradesByDay = new Set()
  trades.forEach((trade) => {
    if (trade.entry_time) {
      const date = new Date(trade.entry_time).toDateString()
      tradesByDay.add(date)
    }
  })
  const avg_trades_per_day = tradesByDay.size > 0 ? total_trades / tradesByDay.size : 0

  // Calculate monthly growth
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
  const currentMonthTrades = closedTrades.filter(t => 
    t.entry_time && new Date(t.entry_time) >= currentMonth
  )
  const lastMonthTrades = closedTrades.filter(t => 
    t.entry_time && new Date(t.entry_time) >= lastMonth && new Date(t.entry_time) < currentMonth
  )

  const currentMonthPnL = currentMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const lastMonthPnL = lastMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  const monthly_growth = lastMonthPnL !== 0 ? ((currentMonthPnL - lastMonthPnL) / Math.abs(lastMonthPnL)) * 100 : 0
  const growth_vs_last_month = currentMonthPnL - lastMonthPnL

  // Calculate risk exposure (as % of total trades)
  const risk_exposure = total_trades > 0 ? (losing_trades / total_trades) * 100 : 0

  return {
    total_trades,
    total_profit_loss: Math.round(total_profit_loss * 100) / 100,
    win_rate: Math.round(win_rate * 100) / 100,
    winning_trades,
    losing_trades,
    avg_win: Math.round(avg_win * 100) / 100,
    avg_loss: Math.round(avg_loss * 100) / 100,
    profit_factor: Math.round(profit_factor * 100) / 100,
    monthly_growth: Math.round(monthly_growth * 100) / 100,
    growth_vs_last_month: Math.round(growth_vs_last_month * 100) / 100,
    avg_trades_per_day: Math.round(avg_trades_per_day * 100) / 100,
    risk_exposure: Math.round(risk_exposure * 100) / 100,
    current_streak,
  }
}
