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

  // Determine sizes: current (100%), previous (80%), 2 months ago (60%)
  const sizeClasses = [
    "w-full sm:w-4/5 md:w-full", // Current month - full width on desktop
    "w-4/5 sm:w-3/5 md:w-4/5",   // Previous month - 80% on desktop, 60% on tablet
    "w-3/5 sm:w-1/2 md:w-3/5",   // 2 months ago - 60% on desktop, 50% on tablet
  ]

  const isPositive = (value: number) => value >= 0

  return (
    <Link href="/dashboard/advanced-stats/time-analysis">
      <div className="space-y-3 cursor-pointer group">
        {timeline.map((month, index) => {
          const isPos = isPositive(month.pnl)
          const sizeClass = sizeClasses[index] || "w-full"

          return (
            <div key={`${month.month}-${index}`} className={`${sizeClass} transition-transform group-hover:scale-105 origin-left`}>
              <Card className="p-3 sm:p-4 bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                      {month.month}
                    </p>
                    <p className={`text-sm sm:text-base md:text-lg font-bold truncate ${isPos ? 'text-chart-1' : 'text-chart-2'}`}>
                      {isPos ? '+' : ''}{month.pnl.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                      {month.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isPos ? 'bg-chart-1/10' : 'bg-chart-2/10'}`}>
                    {isPos ? (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-chart-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-chart-2" />
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </Link>
  )
}
