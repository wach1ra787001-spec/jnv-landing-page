'use client'

import { Card } from '@/components/ui/card'
import { MonthData } from '@/lib/time-analysis-utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MonthOverMonthCardProps {
  monthData: MonthData[]
}

export function MonthOverMonthCard({ monthData }: MonthOverMonthCardProps) {
  const getWinRateColor = (winRate: number) => {
    if (winRate > 55) return 'text-emerald-600'
    if (winRate > 45) return 'text-amber-600'
    return 'text-red-600'
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(`${year}-${month}-01`)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  const getPnLTrend = (current: number, previous: number | undefined) => {
    if (previous === undefined) return null
    const diff = current - previous
    return {
      isUp: diff > 0,
      amount: Math.abs(diff),
      percent: previous !== 0 ? ((diff / Math.abs(previous)) * 100).toFixed(1) : '0',
    }
  }

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h2 className="text-xl font-semibold text-foreground mb-6">Month-over-Month Performance</h2>

      {/* Summary Stats */}
      {monthData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Current Month Stats */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Latest Month</p>
            <p className="text-sm font-semibold text-foreground">{formatMonth(monthData[0].month)}</p>
            <p className="text-xs text-muted-foreground mt-2">Trades: {monthData[0].trades}</p>
          </div>

          {/* Total Months Tracked */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Months Tracked</p>
            <p className="text-2xl font-bold text-foreground">{monthData.length}</p>
          </div>

          {/* Best Month */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-muted-foreground mb-1">Best Month</p>
            <p className="text-lg font-bold text-emerald-600">
              {monthData.reduce((max, m) => (m.pnl > max.pnl ? m : max)).pnl.toFixed(2)}
            </p>
            <p className="text-xs text-emerald-600">{formatMonth(monthData.reduce((max, m) => (m.pnl > max.pnl ? m : max)).month)}</p>
          </div>

          {/* Worst Month */}
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-muted-foreground mb-1">Worst Month</p>
            <p className="text-lg font-bold text-red-600">
              {monthData.reduce((min, m) => (m.pnl < min.pnl ? m : min)).pnl.toFixed(2)}
            </p>
            <p className="text-xs text-red-600">{formatMonth(monthData.reduce((min, m) => (m.pnl < min.pnl ? m : min)).month)}</p>
          </div>
        </div>
      )}

      {/* Monthly Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Month</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Trades</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Win Rate</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Net P&L</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">vs Prev</th>
            </tr>
          </thead>
          <tbody>
            {monthData.map((month, idx) => {
              const prevMonth = idx > 0 ? monthData[idx - 1] : undefined
              const trend = getPnLTrend(month.pnl, prevMonth?.pnl)

              return (
                <tr key={month.month} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-4 px-4 text-foreground font-medium">{formatMonth(month.month)}</td>
                  <td className="text-right py-4 px-4 text-foreground">{month.trades}</td>
                  <td className="text-right py-4 px-4">
                    <span
                      className={
                        month.winRate > 55
                          ? 'text-emerald-600 font-semibold'
                          : month.winRate > 45
                          ? 'text-amber-600 font-semibold'
                          : 'text-red-600 font-semibold'
                      }
                    >
                      {month.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td
                    className={`text-right py-4 px-4 font-semibold ${
                      month.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {month.pnl >= 0 ? '+' : ''}{month.pnl.toFixed(2)}
                  </td>
                  <td className="text-right py-4 px-4">
                    {trend ? (
                      <div className="flex items-center justify-end gap-1">
                        {trend.isUp ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">
                              +{trend.amount.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-semibold">
                              -{trend.amount.toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {monthData.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No trades data available</p>
      )}
    </Card>
  )
}
