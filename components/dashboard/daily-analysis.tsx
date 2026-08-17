"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DayData {
  day: string
  pnl: number
}

interface DailyAnalysisProps {
  data?: DayData[]
}

export function DailyAnalysis({ data }: DailyAnalysisProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-5 bg-card border border-border shadow-sm h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Day-to-Day Analysis
          </h3>
          <p className="text-sm text-muted-foreground">No trading data yet</p>
        </div>
      </Card>
    )
  }

  // Get last 7 days of data for the weekly summary
  const last7Days = data.slice(-7)
  const weeklyTotal = last7Days.reduce((sum, d) => sum + d.pnl, 0)
  const weeklyWins = last7Days.filter(d => d.pnl > 0).length
  const weeklyWinRate = last7Days.length > 0 ? ((weeklyWins / last7Days.length) * 100).toFixed(0) : '0'

  return (
    <Card className="p-5 bg-card border border-border shadow-sm h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Day-to-Day Analysis
      </h3>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {data.map((item, index) => {
          const isProfit = item.pnl > 0
          return (
            <div 
              key={index}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border hover:bg-muted",
              )}
            >
              <span className="font-medium text-foreground text-sm">
                {item.day}
              </span>
              <span className={cn(
                "font-semibold text-sm",
                isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isProfit ? '+' : ''}{item.pnl.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>

      {/* 7-Day Summary */}
      <div className="mt-6 pt-4 border-t border-border space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Last 7 Days Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Total PnL</div>
            <div className={cn(
              "font-bold text-lg",
              weeklyTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {weeklyTotal >= 0 ? '+' : ''}{weeklyTotal.toFixed(2)}
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div className="font-bold text-lg text-foreground">
              {weeklyWinRate}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
