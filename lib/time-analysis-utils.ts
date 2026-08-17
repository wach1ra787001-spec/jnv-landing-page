import { analyzeNewsImpact, tagTradesWithNews } from './economicCalendar'

export interface Trade {
  id: string
  entry_time: string
  exit_time: string
  net_pnl: number
  direction: string
  session: string
  status: string
}

export interface SessionStats {
  name: string
  trades: number
  wins: number
  losses: number
  winRate: number
  pnl: number
}

export interface HoldingTimeBucket {
  bucket: string
  trades: number
  wins: number
  losses: number
  winRate: number
  avgPnL: number
  minDuration: number
  maxDuration: number
}

export interface HoldingTimeTradeData {
  duration: number
  pnl: number
  isWin: boolean
}

export interface NewsTimeStats {
  label: string
  nearNews: {
    trades: number
    wins: number
    losses: number
    winRate: number
    pnl: number
  }
  normalTime: {
    trades: number
    wins: number
    losses: number
    winRate: number
    pnl: number
  }
}

export interface MonthData {
  month: string
  trades: number
  wins: number
  losses: number
  winRate: number
  pnl: number
}

// Define session times (UTC)
const SESSION_TIMES = {
  asia: { start: 0, end: 9 },       // 00:00 - 09:00 UTC
  london: { start: 7, end: 16 },    // 07:00 - 16:00 UTC
  newyork: { start: 13, end: 22 },  // 13:00 - 22:00 UTC
}

function getSessionFromTime(date: Date): string {
  const hour = date.getUTCHours()
  
  if (hour >= SESSION_TIMES.newyork.start && hour < SESSION_TIMES.newyork.end) {
    return 'new_york'
  } else if (hour >= SESSION_TIMES.london.start && hour < SESSION_TIMES.london.end) {
    return 'london'
  } else {
    return 'asia'
  }
}

function getDurationMinutes(entryTime: string, exitTime: string): number {
  const entry = new Date(entryTime)
  const exit = new Date(exitTime)
  return Math.floor((exit.getTime() - entry.getTime()) / (1000 * 60))
}

export function getSessionAnalysis(trades: Trade[]): SessionStats[] {
  const closedTrades = trades.filter(t => t.status === 'closed')
  
  const sessions = {
    asia: { name: 'Asian', trades: [] as Trade[] },
    london: { name: 'London', trades: [] as Trade[] },
    new_york: { name: 'New York', trades: [] as Trade[] },
  }
  
  closedTrades.forEach(trade => {
    const entryDate = new Date(trade.entry_time)
    const session = getSessionFromTime(entryDate)
    if (sessions[session as keyof typeof sessions]) {
      sessions[session as keyof typeof sessions].trades.push(trade)
    }
  })
  
  return Object.entries(sessions).map(([_, sessionData]) => {
    const sessionTrades = sessionData.trades
    const wins = sessionTrades.filter(t => t.net_pnl > 0).length
    const losses = sessionTrades.filter(t => t.net_pnl < 0).length
    const pnl = sessionTrades.reduce((sum, t) => sum + t.net_pnl, 0)
    
    return {
      name: sessionData.name,
      trades: sessionTrades.length,
      wins,
      losses,
      winRate: sessionTrades.length > 0 ? (wins / sessionTrades.length) * 100 : 0,
      pnl,
    }
  })
}

export function getHoldingTimeAnalysis(trades: Trade[]): {
  buckets: HoldingTimeBucket[]
  tradeData: HoldingTimeTradeData[]
  totalTrades: number
} {
  const closedTrades = trades.filter(t => t.status === 'closed')
  
  const tradeData: HoldingTimeTradeData[] = closedTrades.map(trade => ({
    duration: getDurationMinutes(trade.entry_time, trade.exit_time),
    pnl: trade.net_pnl,
    isWin: trade.net_pnl > 0,
  }))
  
  // Define duration buckets
  const bucketRanges = [
    { name: 'Very Short (< 5 min)', min: 0, max: 5 },
    { name: 'Short (5-30 min)', min: 5, max: 30 },
    { name: 'Medium (30 min - 2 hrs)', min: 30, max: 120 },
    { name: 'Long (2-8 hrs)', min: 120, max: 480 },
    { name: 'Very Long (> 8 hrs)', min: 480, max: Infinity },
  ]
  
  const buckets = bucketRanges.map(range => {
    const bucketsData = tradeData.filter(d => d.duration >= range.min && d.duration < range.max)
    const wins = bucketsData.filter(d => d.isWin).length
    const losses = bucketsData.filter(d => !d.isWin).length
    const avgPnL = bucketsData.length > 0 ? bucketsData.reduce((sum, d) => sum + d.pnl, 0) / bucketsData.length : 0
    
    return {
      bucket: range.name,
      trades: bucketsData.length,
      wins,
      losses,
      winRate: bucketsData.length > 0 ? (wins / bucketsData.length) * 100 : 0,
      avgPnL: Math.round(avgPnL * 100) / 100,
      minDuration: range.min,
      maxDuration: range.max === Infinity ? 999999 : range.max,
    }
  })
  
  return {
    buckets: buckets.filter(b => b.trades > 0),
    tradeData: tradeData.slice(0, 100), // Limit for scatter plot
    totalTrades: closedTrades.length,
  }
}

export function getMonthOverMonth(trades: Trade[]): MonthData[] {
  const closedTrades = trades.filter(t => t.status === 'closed')
  
  const monthGroups: { [key: string]: Trade[] } = {}
  
  closedTrades.forEach(trade => {
    const date = new Date(trade.entry_time)
    const monthKey = date.toISOString().split('T')[0].substring(0, 7) // YYYY-MM
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = []
    }
    monthGroups[monthKey].push(trade)
  })
  
  // Sort by month descending (newest first)
  const sortedMonths = Object.keys(monthGroups).sort().reverse()
  
  return sortedMonths.map(month => {
    const monthTrades = monthGroups[month]
    const wins = monthTrades.filter(t => t.net_pnl > 0).length
    const losses = monthTrades.filter(t => t.net_pnl < 0).length
    const pnl = monthTrades.reduce((sum, t) => sum + t.net_pnl, 0)
    
    return {
      month,
      trades: monthTrades.length,
      wins,
      losses,
      winRate: monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0,
      pnl: Math.round(pnl * 100) / 100,
    }
  }).slice(0, 12) // Last 12 months
}
