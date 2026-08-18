"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import type { MonthlyGrowth } from "@/lib/monthly-growth-analysis"

interface KPICardsProps {
  pnl?: number
  growthPercent?: number
  growthVsLastMonth?: number
  totalTrades?: number
  avgTradesPerDay?: number
  winRate?: number
  riskExposure?: number
  consistency?: number
  documentedTrades?: number
  monthlyGrowthTimeline?: MonthlyGrowth[]
}

export function KPICards({
  pnl,
  growthPercent,
  growthVsLastMonth,
  totalTrades,
  avgTradesPerDay,
  winRate,
  riskExposure,
  consistency,
  documentedTrades,
  monthlyGrowthTimeline = []
}: KPICardsProps) {
  const isProfit = (pnl ?? 0) >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
      {/* PnL Card */}
      <Card className="p-3 sm:p-4 md:p-6 bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2 truncate">Total PnL</p>
            <p className={`text-lg sm:text-2xl md:text-3xl font-bold ${isProfit ? 'text-chart-1' : 'text-chart-2'} truncate`}>
              {isProfit ? '+' : ''}{`$${Math.abs(pnl ?? 0).toLocaleString()}`}
            </p>
          </div>
          <div className={`p-1.5 sm:p-2.5 rounded-lg flex-shrink-0 ${isProfit ? 'bg-chart-1/10' : 'bg-chart-2/10'}`}>
            {isProfit ? (
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-chart-1" />
            ) : (
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-chart-2" />
            )}
          </div>
        </div>
      </Card>

      {/* Growth Card - Clickable */}
      <Link href="/dashboard/advanced-stats/time-analysis">
        <Card className="p-3 sm:p-4 md:p-6 bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2 truncate">Growth</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">
                {growthPercent}%
              </p>
              <p className="text-[9px] sm:text-xs text-chart-1 mt-1 sm:mt-2 font-medium truncate">
                +{growthVsLastMonth}% vs last month
              </p>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </div>
        </Card>
      </Link>

      {/* Consistency Card */}
      <Card className="p-3 sm:p-4 md:p-6 bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2 truncate">Consistency</p>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">
              {Math.round(consistency ?? 0)}%
            </p>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
              {documentedTrades} documented
            </p>
          </div>
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
      </Card>

      {/* Win Rate Gauge Card */}
      <Card className="p-3 sm:p-4 md:p-6 bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow relative col-span-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 w-full">
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2 truncate">Win Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">
                {(winRate ?? 0)}%
              </p>
            </div>
            
            {/* Risk Badge - moved below the win rate number */}
            <Badge 
              variant="secondary" 
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0 text-[9px] sm:text-xs mt-2 inline-block"
            >
              Risk: {riskExposure}%
            </Badge>
          </div>
        </div>
        
        {/* Semi-circle Gauge */}
        <div className="mt-3 sm:mt-4 flex justify-center max-w-full overflow-hidden">
          <svg width="auto" height="auto" viewBox="0 0 120 70" className="w-full max-w-[240px]">
            {/* Background arc (gray) */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Green portion (win rate) */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(((winRate ?? 0) / 100) * 157)} 157`}
            />
            {/* Needle */}
              <g transform={`rotate(${-90 + (((winRate ?? 0) / 100) * 180)}, 60, 60)`}>
              <line
                x1="60"
                y1="60"
                x2="60"
                y2="20"
                stroke="#1E293B"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="60" cy="60" r="4" fill="#1E293B" />
            </g>
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </Card>
    </div>
  )
}
