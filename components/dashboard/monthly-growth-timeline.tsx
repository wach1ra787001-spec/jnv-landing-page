"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { MonthlyGrowth } from "@/lib/monthly-growth-analysis"

interface MonthlyGrowthTimelineProps {
  timeline: MonthlyGrowth[]
}

export function MonthlyGrowthTimeline({ timeline }: MonthlyGrowthTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return null
  }

  const isPositive = (value: number) => value >= 0

  // Skip the current month and show previous months as compact indicators
  const previousMonths = timeline.slice(1)

  if (previousMonths.length === 0) {
    return null
  }

  return (
    <Link href="/dashboard/advanced-stats/time">
      <div className="flex gap-2 overflow-x-auto pb-1 group cursor-pointer">
        {previousMonths.map((month, index) => {
          const isPos = isPositive(month.pnl)

          return (
            <div
              key={`${month.month}-${index}`}
              className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-muted/40 border border-border/30 hover:bg-muted/60 transition-colors group-hover:shadow-sm"
            >
              <p className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {month.month}
              </p>
              {month.hasTrades ? (
                <p className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${isPos ? 'text-chart-1' : 'text-chart-2'}`}>
                  {isPos ? '+' : ''}{month.growthPercent.toLocaleString('en-US', { maximumFractionDigits: 1 })}%
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  No trades
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Link>
  )
}
