import { Database } from "@/types/supabase"

type Trade = Database["public"]["Tables"]["trades"]["Row"]

export interface MonthlyGrowth {
  month: string // "Current", "Previous", "2 Months Ago"
  date: Date
  growthPercent: number
  pnl: number
}

/**
 * Calculate growth metrics for the current month and previous 2 months.
 * Each month's growth is the sum of PnL for that month.
 */
export function calculateMonthlyGrowthTimeline(
  trades: Trade[]
): MonthlyGrowth[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Define the three months we want to analyze
  const months = [
    {
      label: "Current",
      year: currentYear,
      month: currentMonth,
      date: new Date(currentYear, currentMonth, 1),
    },
    {
      label: "Previous",
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      date: new Date(
        currentMonth === 0 ? currentYear - 1 : currentYear,
        currentMonth === 0 ? 11 : currentMonth - 1,
        1
      ),
    },
    {
      label: "2 Months Ago",
      year: currentMonth <= 1 ? currentYear - 1 : currentYear,
      month: currentMonth <= 1 ? currentMonth + 10 : currentMonth - 2,
      date: new Date(
        currentMonth <= 1 ? currentYear - 1 : currentYear,
        currentMonth <= 1 ? currentMonth + 10 : currentMonth - 2,
        1
      ),
    },
  ]

  return months.map((monthInfo) => {
    // Filter trades for this specific month
    const monthTrades = trades.filter((trade) => {
      if (!trade.exit_time) return false
      const tradeDate = new Date(trade.exit_time)
      return (
        tradeDate.getFullYear() === monthInfo.year &&
        tradeDate.getMonth() === monthInfo.month
      )
    })

    // Calculate total PnL for the month
    const totalPnL = monthTrades.reduce((sum, trade) => {
      const pnl = (trade.pnl as number) || 0
      return sum + pnl
    }, 0)

    // Calculate growth percentage (PnL as % of previous month's end balance or base unit)
    // For simplicity, we'll express it as just the PnL value
    // If you want percentage vs. starting balance, you'd need account balance data
    const growthPercent = totalPnL > 0 ? Math.min(totalPnL, 999.99) : totalPnL

    return {
      month: monthInfo.label,
      date: monthInfo.date,
      growthPercent,
      pnl: totalPnL,
    }
  })
}
