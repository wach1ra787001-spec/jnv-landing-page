import { Database } from '@/types/supabase'

type Trade = Database['public']['Tables']['trades']['Row']

export interface SessionStats {
  session: string
  trades: number
  winRate: number
  netPnL: number
  avgR: number
}

export interface HoldingTimeData {
  duration: number
  pnl: number
  isWin: boolean
  symbol: string
}

export interface HoldingTimeBucket {
  bucket: string
  trades: number
  winRate: number
  avgPnL: number
}

export interface NewsTimeComparison {
  newsTime: {
    trades: number
    winRate: number
    avgPnL: number
    profitFactor: number
  }
  noNewsTime: {
    trades: number
    winRate: number
    avgPnL: number
    profitFactor: number
  }
}

export interface MonthData {
  month: string
  trades: number
  winRate: number
  netPnL: number
  change: number
}

export interface BiasData {
  direction: 'long' | 'short'
  trades: number
  winRate: number
  netPnL: number
  avgR: number
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  averageStreak: number
}

// Best Sessions Analysis
export function getBestSessions(trades: Trade[]): SessionStats[] {
  const sessionMap = new Map<string, Trade[]>()

  trades.forEach(trade => {
    const session = trade.session || 'Unknown'
    if (!sessionMap.has(session)) {
      sessionMap.set(session, [])
    }
    sessionMap.get(session)!.push(trade)
  })

  const stats: SessionStats[] = Array.from(sessionMap.entries()).map(([session, sessionTrades]) => {
    const wins = sessionTrades.filter(t => (t.net_pnl || 0) > 0).length
    const totalPnL = sessionTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
    const totalR = sessionTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0)

    return {
      session,
      trades: sessionTrades.length,
      winRate: sessionTrades.length > 0 ? (wins / sessionTrades.length) * 100 : 0,
      netPnL: totalPnL,
      avgR: sessionTrades.length > 0 ? totalR / sessionTrades.length : 0,
    }
  })

  return stats.sort((a, b) => b.netPnL - a.netPnL)
}

// Holding Time Analysis
export function getHoldingTimeAnalysis(trades: Trade[]): { data: HoldingTimeData[]; buckets: HoldingTimeBucket[] } {
  const data: HoldingTimeData[] = trades
    .filter(t => t.entry_time && t.exit_time && (t.net_pnl !== null && t.net_pnl !== undefined))
    .map(trade => {
      const entryTime = new Date(trade.entry_time!).getTime()
      const exitTime = new Date(trade.exit_time!).getTime()
      const durationMinutes = (exitTime - entryTime) / (1000 * 60)
      const isWin = (trade.net_pnl || 0) > 0

      return {
        duration: durationMinutes,
        pnl: trade.net_pnl || 0,
        isWin,
        symbol: trade.symbol,
      }
    })

  // Create duration buckets
  const bucketRanges = [
    { label: '0-5 min', min: 0, max: 5 },
    { label: '5-15 min', min: 5, max: 15 },
    { label: '15-30 min', min: 15, max: 30 },
    { label: '30-60 min', min: 30, max: 60 },
    { label: '1-4 hours', min: 60, max: 240 },
    { label: '4+ hours', min: 240, max: Infinity },
  ]

  const buckets: HoldingTimeBucket[] = bucketRanges.map(range => {
    const bucketTrades = data.filter(d => d.duration >= range.min && d.duration < range.max)
    const wins = bucketTrades.filter(t => t.isWin).length
    const totalPnL = bucketTrades.reduce((sum, t) => sum + t.pnl, 0)

    return {
      bucket: range.label,
      trades: bucketTrades.length,
      winRate: bucketTrades.length > 0 ? (wins / bucketTrades.length) * 100 : 0,
      avgPnL: bucketTrades.length > 0 ? totalPnL / bucketTrades.length : 0,
    }
  })

  return { data, buckets }
}

// News Time Comparison
export function getNewsTimeComparison(trades: Trade[]): NewsTimeComparison {
  const newsTimeUTC = [
    { hour: 8, minute: 30 }, // US economic data
    { hour: 13, minute: 30 }, // ECB/UK news
    { hour: 15, minute: 0 }, // US economic data
  ]

  const isNewsTime = (date: Date): boolean => {
    const utcHour = date.getUTCHours()
    const utcMinute = date.getUTCMinutes()

    return newsTimeUTC.some(time => {
      const timeDiff = Math.abs(utcHour * 60 + utcMinute - (time.hour * 60 + time.minute))
      return timeDiff <= 30 || timeDiff >= 1410 // within 30 mins or wrap around
    })
  }

  const newsTimesTrades = trades.filter(t => t.entry_time && isNewsTime(new Date(t.entry_time)))
  const noNewsTimesTrades = trades.filter(t => t.entry_time && !isNewsTime(new Date(t.entry_time)))

  const calculateMetrics = (tradesToAnalyze: Trade[]) => {
    const wins = tradesToAnalyze.filter(t => (t.net_pnl || 0) > 0).length
    const totalPnL = tradesToAnalyze.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
    const grossProfit = tradesToAnalyze.filter(t => (t.net_pnl || 0) > 0).reduce((sum, t) => sum + (t.net_pnl || 0), 0)
    const grossLoss = Math.abs(tradesToAnalyze.filter(t => (t.net_pnl || 0) < 0).reduce((sum, t) => sum + (t.net_pnl || 0), 0))

    return {
      trades: tradesToAnalyze.length,
      winRate: tradesToAnalyze.length > 0 ? (wins / tradesToAnalyze.length) * 100 : 0,
      avgPnL: tradesToAnalyze.length > 0 ? totalPnL / tradesToAnalyze.length : 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : 0,
    }
  }

  return {
    newsTime: calculateMetrics(newsTimesTrades),
    noNewsTime: calculateMetrics(noNewsTimesTrades),
  }
}

// Month-over-Month Comparison
export function getMoMComparison(trades: Trade[]): MonthData[] {
  const monthMap = new Map<string, Trade[]>()

  trades.forEach(trade => {
    if (!trade.entry_time) return
    const date = new Date(trade.entry_time)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, [])
    }
    monthMap.get(monthKey)!.push(trade)
  })

  const months = Array.from(monthMap.entries()).sort()
  const monthData: MonthData[] = months.map(([month, monthTrades], index) => {
    const wins = monthTrades.filter(t => (t.net_pnl || 0) > 0).length
    const totalPnL = monthTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)

    let change = 0
    if (index > 0) {
      const prevMonthTrades = months[index - 1][1]
      const prevTotalPnL = prevMonthTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
      change = prevTotalPnL > 0 ? ((totalPnL - prevTotalPnL) / prevTotalPnL) * 100 : 0
    }

    return {
      month,
      trades: monthTrades.length,
      winRate: monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0,
      netPnL: totalPnL,
      change,
    }
  })

  return monthData
}

// Direction Bias Tracker
export function getBiasTracker(trades: Trade[]): BiasData[] {
  const directionMap = new Map<'long' | 'short', Trade[]>()

  trades.forEach(trade => {
    const direction = (trade.direction?.toLowerCase() as 'long' | 'short') || 'long'
    if (!directionMap.has(direction)) {
      directionMap.set(direction, [])
    }
    directionMap.get(direction)!.push(trade)
  })

  const result: BiasData[] = []

  directionMap.forEach((directionTrades, direction) => {
    const wins = directionTrades.filter(t => (t.net_pnl || 0) > 0).length
    const totalPnL = directionTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
    const totalR = directionTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0)

    result.push({
      direction,
      trades: directionTrades.length,
      winRate: directionTrades.length > 0 ? (wins / directionTrades.length) * 100 : 0,
      netPnL: totalPnL,
      avgR: directionTrades.length > 0 ? totalR / directionTrades.length : 0,
    })
  })

  return result
}

// Win/Loss Ratio Analysis
export function getWinLossRatio(trades: Trade[]) {
  const wins = trades.filter(t => (t.net_pnl || 0) > 0)
  const losses = trades.filter(t => (t.net_pnl || 0) < 0)

  const totalWins = wins.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.net_pnl || 0), 0))

  const avgWin = wins.length > 0 ? totalWins / wins.length : 0
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0

  return {
    winLossRatio: losses.length > 0 ? wins.length / losses.length : wins.length,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
    avgWin,
    avgLoss,
    expectancy: trades.length > 0 ? (totalWins - totalLosses) / trades.length : 0,
  }
}

// Setup Performance
export function getSetupPerformance(trades: Trade[]) {
  const setupMap = new Map<string, Trade[]>()

  trades.forEach(trade => {
    const setup = trade.strategy || 'Unknown'
    if (!setupMap.has(setup)) {
      setupMap.set(setup, [])
    }
    setupMap.get(setup)!.push(trade)
  })

  const results = Array.from(setupMap.entries()).map(([setup, setupTrades]) => {
    const wins = setupTrades.filter(t => (t.net_pnl || 0) > 0).length
    const totalPnL = setupTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
    const grossProfit = setupTrades.filter(t => (t.net_pnL || 0) > 0).reduce((sum, t) => sum + (t.net_pnl || 0), 0)
    const grossLoss = Math.abs(setupTrades.filter(t => (t.net_pnl || 0) < 0).reduce((sum, t) => sum + (t.net_pnl || 0), 0))
    const totalR = setupTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0)

    return {
      setup,
      trades: setupTrades.length,
      winRate: setupTrades.length > 0 ? (wins / setupTrades.length) * 100 : 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      avgR: setupTrades.length > 0 ? totalR / setupTrades.length : 0,
      netPnL: totalPnL,
    }
  })

  return results.sort((a, b) => b.profitFactor - a.profitFactor)
}
