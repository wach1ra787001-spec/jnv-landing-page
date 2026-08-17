'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  getSessionAnalysis,
  getHoldingTimeAnalysis,
  getMonthOverMonth,
} from '@/lib/time-analysis-utils'
import { SessionAnalysisCard } from './SessionAnalysisCard'
import { HoldingTimeVsPnLCard } from './HoldingTimeVsPnLCard'
import { NewsTimeImpactCard } from './NewsTimeImpactCard'
import { MonthOverMonthCard } from './MonthOverMonthCard'

interface TimeAnalysisClientProps {
  trades: any[]
  newsImpactData?: {
    nearNews: { trades: number; wins: number; losses: number; winRate: number; pnl: number }
    normalTime: { trades: number; wins: number; losses: number; winRate: number; pnl: number }
  }
}

export function TimeAnalysisClient({ trades, newsImpactData }: TimeAnalysisClientProps) {
  const router = useRouter()

  // Calculate all analysis data
  const sessionStats = getSessionAnalysis(trades)
  const holdingTimeData = getHoldingTimeAnalysis(trades)
  const monthOverMonth = getMonthOverMonth(trades)

  // Use provided news impact data or default empty stats
  const newsTimeImpact = newsImpactData || {
    nearNews: { trades: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 },
    normalTime: { trades: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 },
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with Back Button */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Time Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Explore your trading patterns across time: best sessions, holding periods, and market timing
          </p>
        </div>
      </div>

      {/* Content - Single Column Layout */}
      <div className="flex flex-col gap-6">
        {/* Card 1: Session Analysis */}
        <SessionAnalysisCard sessions={sessionStats} />

        {/* Card 2: Holding Time vs P&L */}
        <HoldingTimeVsPnLCard
          buckets={holdingTimeData.buckets}
          tradeData={holdingTimeData.tradeData}
          totalTrades={holdingTimeData.totalTrades}
        />

        {/* Card 3: News Time Impact */}
        <NewsTimeImpactCard
          nearNews={newsTimeImpact.nearNews}
          normalTime={newsTimeImpact.normalTime}
        />

        {/* Card 4: Month over Month */}
        <MonthOverMonthCard monthData={monthOverMonth} />
      </div>
    </div>
  )
}
