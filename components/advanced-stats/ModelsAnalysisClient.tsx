'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  computeSetupPerformance,
  computeBiasEffects,
  computeProfitFactorAnalysis,
  ModelTrade,
} from '@/lib/models-analysis-utils'
import { SetupPerformanceCard } from '@/components/advanced-stats/models/SetupPerformanceCard'
import { WinLossDistributionCard } from '@/components/advanced-stats/models/WinLossDistributionCard'
import { BiasEffectsCard } from '@/components/advanced-stats/models/BiasEffectsCard'
import { ProfitFactorAnalysisCard } from '@/components/advanced-stats/models/ProfitFactorAnalysisCard'

interface ModelsAnalysisClientProps {
  trades: ModelTrade[]
}

export function ModelsAnalysisClient({ trades }: ModelsAnalysisClientProps) {
  const router = useRouter()

  const setupPerformance = useMemo(() => computeSetupPerformance(trades), [trades])
  const biasEffects = useMemo(() => computeBiasEffects(trades), [trades])
  const profitFactor = useMemo(() => computeProfitFactorAnalysis(trades), [trades])

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
          <h1 className="text-3xl font-semibold text-foreground">Models & Setup</h1>
          <p className="text-muted-foreground mt-1">
            Performance breakdown by strategy, setup, and market conditions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SetupPerformanceCard data={setupPerformance} />
          <WinLossDistributionCard trades={trades} />
        </div>

        <BiasEffectsCard data={biasEffects} />

        <ProfitFactorAnalysisCard data={profitFactor} />
      </div>
    </div>
  )
}
