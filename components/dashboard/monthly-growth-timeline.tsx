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

  const currentMonth = timeline[0]
  const previousMonths = timeline.slice(1)

  return (
    <Link href="/dashboard/advanced-stats/time" className="block">
      <div className="rounded-xl border border-border/50 bg-card/50 px-4 py-5 sm:px-6 sm:py-6 transition-colors hover:border-border hover:bg-card/70">
        <div className="flex min-h-32 flex-col items-center justify-center gap-4 sm:min-h-36">
          {currentMonth?.hasTrades ? (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current month</p>
              <p className={`mt-1 text-lg font-bold ${currentMonth.growthPercent >= 0 ? "text-chart-1" : "text-chart-2"}`}>
                {currentMonth.growthPercent >= 0 ? "+" : ""}{currentMonth.growthPercent.toLocaleString("en-US", { maximumFractionDigits: 1 })}% MoM
              </p>
            </div>
          ) : (
            <p className="text-center text-sm font-medium text-muted-foreground">No trades this month</p>
          )}

          <div className="flex w-full flex-col items-center gap-2 sm:gap-3">
            {previousMonths.map((month, index) => (
              <div
                key={`${month.month}-${index}`}
                className={`flex min-h-12 items-center justify-center rounded-lg border border-border/50 bg-background/60 px-4 py-2 text-center transition-colors hover:bg-background/90 ${
                  index === 0 ? "w-4/5 sm:w-3/4" : "w-3/5 sm:w-1/2"
                }`}
              >
                <p className={`text-xs sm:text-sm font-semibold ${month.hasTrades ? (month.growthPercent >= 0 ? "text-chart-1" : "text-chart-2") : "text-muted-foreground"}`}>
                  {month.hasTrades
                    ? `${month.month} ${month.growthPercent >= 0 ? "+" : ""}${month.growthPercent.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`
                    : `${month.month} — No trades taken yet`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
