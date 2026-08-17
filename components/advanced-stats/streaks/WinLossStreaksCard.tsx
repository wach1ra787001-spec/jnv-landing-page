'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { WinLossStreaksResult } from '@/lib/streaks-analysis-utils'
import { Flame, Snowflake } from 'lucide-react'

interface WinLossStreaksCardProps {
  data: WinLossStreaksResult
}

const WIN_COLOR = '#10b981'
const LOSS_COLOR = '#ef4444'
const BREAKEVEN_COLOR = '#94a3b8'

function outcomeColor(outcome: 'win' | 'loss' | 'breakeven') {
  if (outcome === 'win') return WIN_COLOR
  if (outcome === 'loss') return LOSS_COLOR
  return BREAKEVEN_COLOR
}

export function WinLossStreaksCard({ data }: WinLossStreaksCardProps) {
  const { sequence, histogram, longestWinStreak, longestLossStreak, currentStreak, avgWinStreakLength, avgLossStreakLength } = data
  const [showAll, setShowAll] = useState(false)

  const visibleSequence = showAll ? sequence : sequence.slice(-60)

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-1">Win-Loss Streaks</h3>
      <p className="text-sm text-muted-foreground mb-6">
        What happened, in order, and how your streaks are distributed
      </p>

      {sequence.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No closed trades available</p>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs text-muted-foreground">Longest win streak</p>
              </div>
              <p className="text-lg font-bold text-emerald-600">{longestWinStreak}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Snowflake className="w-3.5 h-3.5 text-red-600" />
                <p className="text-xs text-muted-foreground">Longest loss streak</p>
              </div>
              <p className="text-lg font-bold text-red-600">{longestLossStreak}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg win streak</p>
              <p className="text-lg font-bold text-foreground">{avgWinStreakLength.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current streak</p>
              <p
                className={`text-lg font-bold ${
                  currentStreak?.type === 'win'
                    ? 'text-emerald-600'
                    : currentStreak?.type === 'loss'
                    ? 'text-red-600'
                    : 'text-foreground'
                }`}
              >
                {currentStreak ? `${currentStreak.length} ${currentStreak.type}${currentStreak.length > 1 ? 's' : ''}` : '—'}
              </p>
            </div>
          </div>

          {/* Chronological sequence strip */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Trade Sequence</h4>
              {sequence.length > 60 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  {showAll ? 'Show recent 60' : `Show all ${sequence.length}`}
                </button>
              )}
            </div>
            <TooltipProvider delayDuration={100}>
              <div className="flex flex-wrap gap-1">
                {visibleSequence.map(entry => (
                  <UiTooltip key={entry.index}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-4 h-6 rounded-[3px] cursor-default transition-transform hover:scale-125"
                        style={{ backgroundColor: outcomeColor(entry.outcome) }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p>
                        {entry.symbol ?? 'Trade'} {entry.direction ? `· ${entry.direction}` : ''}
                      </p>
                      <p className={entry.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}
                      </p>
                    </TooltipContent>
                  </UiTooltip>
                ))}
              </div>
            </TooltipProvider>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: WIN_COLOR }} /> Win
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: LOSS_COLOR }} /> Loss
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: BREAKEVEN_COLOR }} /> Breakeven
              </span>
            </div>
          </div>

          {/* Streak-length histogram */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Streak Length Distribution</h4>
            <p className="text-xs text-muted-foreground mb-3">How many streaks of each length you&apos;ve had</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={histogram} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="length" tick={{ fontSize: 12 }} label={{ value: 'Streak length', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="win" name="Win streaks" fill={WIN_COLOR} radius={[3, 3, 0, 0]} />
                <Bar dataKey="loss" name="Loss streaks" fill={LOSS_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
