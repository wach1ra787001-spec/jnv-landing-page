import { Database } from '@/types/supabase'

type Trade = Database['public']['Tables']['trades']['Row']

export interface EquityCurveDataPoint {
  time: string
  label: string
  value: number
}

export interface DailyPnL {
  day: string
  pnl: number
}

// Generate equity curve data from trades
export function generateEquityCurveData(trades: Trade[], period: string = 'monthly'): EquityCurveDataPoint[] {
  if (!trades || trades.length === 0) return []

  const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null)
  
  // Group trades by time period
  const groupedTrades = new Map<string, number>()
  let runningBalance = 0

  closedTrades.forEach((trade) => {
    const entryTime = trade.entry_time ? new Date(trade.entry_time) : null
    if (!entryTime) return

    let key = ''
    let label = ''

    switch (period) {
      case 'today': {
        const hours = entryTime.getHours()
        key = `${hours}:00`
        label = `${hours % 12 || 12}:00 ${hours >= 12 ? 'PM' : 'AM'}`
        break
      }
      case 'weekly': {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][entryTime.getDay()]
        key = dayName
        label = dayName
        break
      }
      case 'monthly': {
        const date = entryTime.getDate()
        key = `${entryTime.getMonth() + 1}/${date}`
        label = `Mar ${date}`
        break
      }
      case 'yearly': {
        const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][entryTime.getMonth()]
        key = monthName
        label = monthName
        break
      }
    }

    if (!groupedTrades.has(key)) {
      runningBalance += trade.pnl || 0
      groupedTrades.set(key, runningBalance)
    } else {
      runningBalance += trade.pnl || 0
      groupedTrades.set(key, runningBalance)
    }
  })

  // Convert to array with starting point
  const data: EquityCurveDataPoint[] = [
    {
      time: 'Start',
      label: 'Start',
      value: 0,
    },
  ]

  let balance = 0
  groupedTrades.forEach((pnl, key) => {
    balance += pnl
    data.push({
      time: key,
      label: key,
      value: 10000 + balance, // Assume starting balance of $10,000
    })
  })

  return data
}

// Generate daily P&L breakdown for a specific period
export function generateDailyPnLByPeriod(trades: Trade[], period: string = 'monthly'): DailyPnL[] {
  if (!trades || trades.length === 0) return []

  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== null)
  const dailyPnL = new Map<string, { pnl: number; exitDate: Date }>()
  const now = new Date()

  closedTrades.forEach((trade) => {
    const exitTime = trade.exit_time ? new Date(trade.exit_time) : null
    if (!exitTime) return

    let dateString = ''
    let shouldInclude = false

    switch (period) {
      case 'today': {
        // Group by hour for today
        const isToday = exitTime.toDateString() === now.toDateString()
        if (isToday) {
          const hours = exitTime.getHours()
          dateString = `${hours % 12 || 12}:00 ${hours >= 12 ? 'PM' : 'AM'}`
          shouldInclude = true
        }
        break
      }
      case 'weekly': {
        // Group by day for last 7 days
        const daysDiff = Math.floor((now.getTime() - exitTime.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 0 && daysDiff < 7) {
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][exitTime.getDay()]
          const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][exitTime.getMonth()]
          dateString = `${monthName} ${exitTime.getDate()}`
          shouldInclude = true
        }
        break
      }
      case 'monthly': {
        // Group by day for current month only
        const isCurrentMonth = exitTime.getMonth() === now.getMonth() && exitTime.getFullYear() === now.getFullYear()
        if (isCurrentMonth) {
          const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][exitTime.getMonth()]
          dateString = `${monthName} ${exitTime.getDate()}`
          shouldInclude = true
        }
        break
      }
      case 'yearly': {
        // Group by month for current year
        const isCurrentYear = exitTime.getFullYear() === now.getFullYear()
        if (isCurrentYear) {
          const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][exitTime.getMonth()]
          dateString = monthName
          shouldInclude = true
        }
        break
      }
    }

    if (shouldInclude && dateString) {
      if (!dailyPnL.has(dateString)) {
        dailyPnL.set(dateString, { pnl: trade.pnl || 0, exitDate: exitTime })
      } else {
        const existing = dailyPnL.get(dateString)!
        dailyPnL.set(dateString, { pnl: existing.pnl + (trade.pnl || 0), exitDate: exitTime })
      }
    }
  })

  return Array.from(dailyPnL.entries())
    .sort((a, b) => a[1].exitDate.getTime() - b[1].exitDate.getTime())
    .map(([day, { pnl }]) => ({ day, pnl }))
}
