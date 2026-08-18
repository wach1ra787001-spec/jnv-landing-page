'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardCheck, ShieldCheck, Target, NotebookPen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ConsistencyAverageBreakdown } from '@/lib/consistency-score'

interface ConsistencyAnalysisClientProps {
  breakdown: ConsistencyAverageBreakdown
  totalTrades: number
  documentedTrades: number
  hasActiveRules: boolean
}

const CIRCLE_SIZE = 180
const STROKE_WIDTH = 14
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreColor(percent: number) {
  if (percent >= 80) return 'text-chart-1'
  if (percent >= 50) return 'text-amber-500'
  return 'text-chart-2'
}

function strokeColor(percent: number) {
  if (percent >= 80) return '#059669'
  if (percent >= 50) return '#F59E0B'
  return '#DC2626'
}

const categories = [
  {
    key: 'rulesPercent' as const,
    scoreKey: 'rulesScore' as const,
    label: 'Rules Followed',
    weightLabel: '30% weight',
    icon: ClipboardCheck,
  },
  {
    key: 'riskModelPercent' as const,
    scoreKey: 'riskModelScore' as const,
    label: 'Risk Model',
    weightLabel: '20% weight',
    icon: ShieldCheck,
  },
  {
    key: 'tradeModelPercent' as const,
    scoreKey: 'tradeModelScore' as const,
    label: 'Trade Model',
    weightLabel: '20% weight',
    icon: Target,
  },
  {
    key: 'journalingPercent' as const,
    scoreKey: 'journalingScore' as const,
    label: 'Journaling',
    weightLabel: '30% weight',
    icon: NotebookPen,
  },
]

export function ConsistencyAnalysisClient({
  breakdown,
  totalTrades,
  documentedTrades,
  hasActiveRules,
}: ConsistencyAnalysisClientProps) {
  const router = useRouter()
  const hasTrades = totalTrades > 0
  const overall = hasTrades ? breakdown.total : 0
  const dashOffset = CIRCUMFERENCE - (overall / 100) * CIRCUMFERENCE

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
          <h1 className="text-3xl font-semibold text-foreground">Consistency Analysis</h1>
          <p className="text-muted-foreground mt-1">
            How closely you follow your rules, risk model, trade model, and journaling habits
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Overall radial gauge */}
        <Card className="p-6 sm:p-8 border border-border/50">
          <div className="flex flex-col items-center gap-4">
            {hasTrades ? (
              <>
                <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
                  <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} className="-rotate-90">
                    <circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={RADIUS}
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth={STROKE_WIDTH}
                    />
                    <circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={RADIUS}
                      fill="none"
                      stroke={strokeColor(overall)}
                      strokeWidth={STROKE_WIDTH}
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl sm:text-4xl font-bold ${scoreColor(overall)}`}>
                      {Math.round(overall)}%
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Overall</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {documentedTrades} of {totalTrades} trades documented
                </p>
              </>
            ) : (
              <p className="text-base font-medium text-muted-foreground py-8">No trades taken yet</p>
            )}
          </div>
        </Card>

        {/* Breakdown bars */}
        <Card className="p-6 border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Breakdown by Category</h2>
          <div className="flex flex-col gap-5">
            {categories.map((category) => {
              const Icon = category.icon
              const percent = hasTrades ? breakdown[category.key] : 0
              const score = hasTrades ? breakdown[category.scoreKey] : 0

              return (
                <div key={category.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{category.label}</span>
                      <span className="text-xs text-muted-foreground">({category.weightLabel})</span>
                    </div>
                    <span className={`text-sm font-semibold ${scoreColor(percent)}`}>
                      {hasTrades ? `${Math.round(percent)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(Math.max(percent, 0), 100)}%`,
                        backgroundColor: strokeColor(percent),
                      }}
                    />
                  </div>
                  {hasTrades && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Avg {score.toFixed(1)} pts earned toward this category
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          {!hasActiveRules && hasTrades && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-4">
              Set up active rules in Manage Rules to start earning points for Rules Followed.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
