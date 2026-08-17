'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  computeDirectionalBias,
  computeWinLossStreaks,
  computeDisciplineTracker,
  computeRecoveryPatterns,
} from '@/lib/streaks-analysis-utils'
import { DirectionalBiasCard } from '@/components/advanced-stats/streaks/DirectionalBiasCard'
import { WinLossStreaksCard } from '@/components/advanced-stats/streaks/WinLossStreaksCard'
import { DisciplineTrackerCard } from '@/components/advanced-stats/streaks/DisciplineTrackerCard'
import { RecoveryPatternsCard } from '@/components/advanced-stats/streaks/RecoveryPatternsCard'

interface StreaksAnalysisClientProps {
  trades: any[]
}

export function StreaksAnalysisClient({ trades }: StreaksAnalysisClientProps) {
  const router = useRouter()

  const directionalBias = useMemo(() => computeDirectionalBias(trades), [trades])
  const winLossStreaks = useMemo(() => computeWinLossStreaks(trades), [trades])
  const disciplineTracker = useMemo(() => computeDisciplineTracker(trades), [trades])
  const recoveryPatterns = useMemo(() => computeRecoveryPatterns(trades), [trades])

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
          <h1 className="text-3xl font-semibold text-foreground">Streaks & Discipline</h1>
          <p className="text-muted-foreground mt-1">
            Track your winning/losing streaks, discipline milestones, and directional bias
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <WinLossStreaksCard data={winLossStreaks} />
          <DirectionalBiasCard data={directionalBias} />
        </div>

        <DisciplineTrackerCard data={disciplineTracker} />

        <RecoveryPatternsCard data={recoveryPatterns} />
      </div>
    </div>
  )
}
