import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface MT5TradeMetrics {
  total_trades: number
  winning_trades: number
  losing_trades: number
  breakeven_trades: number
  win_rate_pct: number
  total_pnl: number
  average_pnl: number
  largest_win: number
  largest_loss: number
  profit_factor: number
  average_r_multiple: number
  max_consecutive_wins: number
  max_consecutive_losses: number
  expectancy: number
}

/**
 * Calculate trade metrics for a user from MT5 processed trades
 */
export async function calculateMT5TradeMetrics(
  userId: string,
  connectionId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<MT5TradeMetrics> {
  try {
    let query = supabase
      .from('mt5_processed_trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'closed')

    if (connectionId) {
      query = query.eq('connection_id', connectionId)
    }

    if (dateFrom) {
      query = query.gte('entry_time', dateFrom.toISOString())
    }

    if (dateTo) {
      query = query.lte('exit_time', dateTo.toISOString())
    }

    const { data: trades, error } = await query

    if (error) throw error
    if (!trades || trades.length === 0) {
      return {
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        breakeven_trades: 0,
        win_rate_pct: 0,
        total_pnl: 0,
        average_pnl: 0,
        largest_win: 0,
        largest_loss: 0,
        profit_factor: 0,
        average_r_multiple: 0,
        max_consecutive_wins: 0,
        max_consecutive_losses: 0,
        expectancy: 0,
      }
    }

    const totalTrades = trades.length
    let winnersCount = 0
    let losersCount = 0
    let breakevenCount = 0
    let totalPnl = 0
    let grossProfit = 0
    let grossLoss = 0
    let largestWin = 0
    let largestLoss = 0
    let rMultiplesSum = 0
    let consecutiveWins = 0
    let consecutiveLosses = 0
    let maxConsecutiveWins = 0
    let maxConsecutiveLosses = 0

    for (const trade of trades) {
      const pnl = trade.profit || 0

      if (pnl > 0) {
        winnersCount++
        grossProfit += pnl
        largestWin = Math.max(largestWin, pnl)
        consecutiveWins++
        consecutiveLosses = 0
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins)
      } else if (pnl < 0) {
        losersCount++
        grossLoss += Math.abs(pnl)
        largestLoss = Math.min(largestLoss, pnl)
        consecutiveLosses++
        consecutiveWins = 0
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses)
      } else {
        breakevenCount++
      }

      totalPnl += pnl

      // Approximate R multiple (would be calculated more accurately from risk/reward)
      if (trade.stop_loss && trade.entry_price && trade.exit_price) {
        const riskDistance = Math.abs(trade.entry_price - trade.stop_loss)
        const rewardDistance = Math.abs(trade.exit_price - trade.entry_price)
        const rMultiple = riskDistance > 0 ? rewardDistance / riskDistance : 0
        rMultiplesSum += rMultiple
      }
    }

    const winRate = totalTrades > 0 ? (winnersCount / totalTrades) * 100 : 0
    const averagePnl = totalTrades > 0 ? totalPnl / totalTrades : 0
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0
    const averageRMultiple = totalTrades > 0 ? rMultiplesSum / totalTrades : 0
    const expectancy = averagePnl

    return {
      total_trades: totalTrades,
      winning_trades: winnersCount,
      losing_trades: losersCount,
      breakeven_trades: breakevenCount,
      win_rate_pct: parseFloat(winRate.toFixed(2)),
      total_pnl: parseFloat(totalPnl.toFixed(2)),
      average_pnl: parseFloat(averagePnl.toFixed(2)),
      largest_win: parseFloat(largestWin.toFixed(2)),
      largest_loss: parseFloat(largestLoss.toFixed(2)),
      profit_factor: parseFloat(profitFactor.toFixed(2)),
      average_r_multiple: parseFloat(averageRMultiple.toFixed(2)),
      max_consecutive_wins: maxConsecutiveWins,
      max_consecutive_losses: maxConsecutiveLosses,
      expectancy: parseFloat(expectancy.toFixed(2)),
    }
  } catch (error) {
    console.error('Error calculating trade metrics:', error)
    throw error
  }
}

/**
 * Get dashboard summary for MT5 account
 */
export async function getMT5DashboardSummary(
  userId: string,
  connectionId?: string
) {
  try {
    // Get latest account snapshot
    let snapshotQuery = supabase
      .from('mt5_account_snapshots')
      .select('*')

    if (connectionId) {
      snapshotQuery = snapshotQuery.eq('connection_id', connectionId)
    }

    const { data: snapshots } = await snapshotQuery
      .order('created_at', { ascending: false })
      .limit(1)

    const latestSnapshot = snapshots?.[0]

    // Get today's trades
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let tradesQuery = supabase
      .from('mt5_processed_trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'closed')
      .gte('entry_time', today.toISOString())

    if (connectionId) {
      tradesQuery = tradesQuery.eq('connection_id', connectionId)
    }

    const { data: todayTrades } = await tradesQuery

    // Calculate today's stats
    const todayPnl = todayTrades?.reduce((sum, trade) => sum + (trade.profit || 0), 0) ?? 0
    const todayTradesCount = todayTrades?.length ?? 0
    const todayWins = todayTrades?.filter((t) => (t.profit ?? 0) > 0).length ?? 0

    // Get open positions
    let openPosQuery = supabase
      .from('mt5_processed_trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')

    if (connectionId) {
      openPosQuery = openPosQuery.eq('connection_id', connectionId)
    }

    const { data: openPositions } = await openPosQuery

    const totalFloatingPnl = openPositions?.reduce((sum, pos) => sum + (pos.profit ?? 0), 0) ?? 0

    // Get connection info
    let connQuery = supabase
      .from('mt5_connections')
      .select('*')

    if (connectionId) {
      connQuery = connQuery.eq('id', connectionId)
    }

    const { data: connections } = await connQuery

    return {
      account: latestSnapshot,
      today: {
        trades_count: todayTradesCount,
        pnl: todayPnl,
        wins: todayWins,
        win_rate: todayTradesCount > 0 ? ((todayWins / todayTradesCount) * 100).toFixed(2) : '0',
      },
      positions: {
        open_count: openPositions?.length ?? 0,
        floating_pnl: totalFloatingPnl,
      },
      connections: connections ?? [],
    }
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    throw error
  }
}

/**
 * Get recent trades for display
 */
export async function getRecentMT5Trades(
  userId: string,
  limit: number = 10,
  connectionId?: string
) {
  try {
    let query = supabase
      .from('mt5_processed_trades')
      .select(
        `
        id,
        symbol,
        direction,
        volume,
        entry_price,
        exit_price,
        entry_time,
        exit_time,
        profit,
        status,
        stop_loss,
        take_profit,
        mt5_ticket,
        mt5_connections(broker_name, account_login)
      `
      )
      .eq('user_id', userId)

    if (connectionId) {
      query = query.eq('connection_id', connectionId)
    }

    const { data, error } = await query
      .order('entry_time', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching recent trades:', error)
    return []
  }
}
