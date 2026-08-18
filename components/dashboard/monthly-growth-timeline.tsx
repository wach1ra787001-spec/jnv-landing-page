"use client"

import Link from "next/link"
import type { MonthlyGrowth } from "@/lib/monthly-growth-analysis"

interface MonthlyGrowthTimelineProps {
  timeline: MonthlyGrowth[]
}

export function MonthlyGrowthTimeline({ timeline }: MonthlyGrowthTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return null
  }

  const previousMonths = timeline.slice(1)

  if (previousMonths.length === 0) {
    return null
  }

  return (
    <Link href="/dashboard/advanced-stats/time" className="block">
      <div className="flex flex-col gap-2 w-[17px] group cursor-pointer">
        {previousMonths.map((month, index) => (
          <div
            key={`${month.month}-${index}`}
            className="flex-shrink-0 rounded-md border border-border/30 bg-muted/40 px-2 py-1.5 transition-colors hover:bg-muted/60 group-hover:shadow-sm sm:px-3 sm:py-2"
          >
            <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap sm:text-[9px]">
              {month.month}
            </p>
            {month.hasTrades ? (
              <p className={`text-[10px] font-bold whitespace-nowrap sm:text-xs ${month.growthPercent >= 0 ? "text-chart-1" : "text-chart-2"}`}>
                {month.growthPercent >= 0 ? "+" : ""}{month.growthPercent.toLocaleString("en-US", { maximumFractionDigits: 1 })}%
              </p>
            ) : (
              <p className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap sm:text-xs">
                No trades
              </p>
            )}
          </div>
        ))}
      </div>
    </Link>
  )
}
