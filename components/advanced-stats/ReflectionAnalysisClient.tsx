'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { JournalEffectCard } from '@/components/advanced-stats/reflection/JournalEffectCard'
import { NoteCorrelationCard } from '@/components/advanced-stats/reflection/NoteCorrelationCard'
import { PreMarketPlanningCard } from '@/components/advanced-stats/reflection/PreMarketPlanningCard'
import {
  computeLossJournalEffect,
  computeNoteCorrelation,
  computeWinJournalEffect,
  ReflectionTrade,
} from '@/lib/reflection-analysis-utils'

interface ReflectionAnalysisClientProps {
  trades: ReflectionTrade[]
}

export function ReflectionAnalysisClient({ trades }: ReflectionAnalysisClientProps) {
  const router = useRouter()

  const winJournalEffect = useMemo(() => computeWinJournalEffect(trades), [trades])
  const lossJournalEffect = useMemo(() => computeLossJournalEffect(trades), [trades])
  const noteCorrelation = useMemo(() => computeNoteCorrelation(trades), [trades])

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
          <h1 className="text-3xl font-semibold text-foreground">Reflection Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Understand how journalling and planning impact your trading outcomes
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JournalEffectCard
          title="Win Journal Effect"
          description="How journalling a winning trade impacts the next trade's outcome"
          data={winJournalEffect}
          leftLabel="Not journaled"
          rightLabel="Journaled"
        />

        <JournalEffectCard
          title="Loss Journal Effect"
          description="How journalling a losing trade impacts the recovery trade's outcome"
          data={lossJournalEffect}
          leftLabel="Not journaled"
          rightLabel="Journaled"
        />

        <PreMarketPlanningCard />

        <NoteCorrelationCard data={noteCorrelation} />
      </div>
    </div>
  )
}
