'use client'

import { Card } from '@/components/ui/card'
import {
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { RecoveryPatternsResult } from '@/lib/streaks-analysis-utils'
import { TrendingUp, TimerReset } from 'lucide-react'

interface RecoveryPatternsCardProps {
  data: RecoveryPatternsResult
}

const AVG_COLOR = '#3b82f6' // blue
const BAND_COLOR = '#3b82f6'

export function RecoveryPatternsCard({ data }: RecoveryPatternsCardProps) {
  const {
    curve,
    timeToRecovery,
    avgTimeToRecovery,
    recoveredCount,
    unrecoveredCount,
    totalLossStreaksAnalyzed,
    minStreakLengthUsed,
  } = data

  const hasData = totalLossStreaksAnalyzed > 0 && curve.length > 0
  const recoveryRate = totalLossStreaksAnalyzed > 0 ? (recoveredCount / totalLossStreaksAnalyzed) * 100 : 0

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-1">Recovery Patterns</h3>
      <p className="text-sm text-muted-foreground mb-6">
        How you bounce back after a losing sequence{' '}
        {hasData && (
          <span>
            (streaks of {minStreakLengthUsed}+ loss{minStreakLengthUsed > 1 ? 'es' : ''})
          </span>
        )}
      </p>

      {!hasData ? (
        <p className="text-center text-muted-foreground py-8">Not enough losing streaks with follow-up trades yet</p>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs text-muted-foreground">Recovery rate</p>
              </div>
              <p className="text-lg font-bold text-emerald-600">{recoveryRate.toFixed(0)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TimerReset className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Avg time to recover</p>
              </div>
              <p className="text-lg font-bold text-foreground">
                {avgTimeToRecovery !== null ? `${avgTimeToRecovery.toFixed(1)} trades` : '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Streaks analyzed</p>
              <p className="text-lg font-bold text-foreground">{totalLossStreaksAnalyzed}</p>
            </div>
          </div>

          {/* Averaged recovery curve with percentile band */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-foreground mb-1">Average Recovery Curve</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Cumulative P&amp;L rebased to 0 right after a losing streak ends — shaded band is the 25th-75th
              percentile range across all streaks
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={curve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="step"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Trades since streak end', position: 'insideBottom', offset: -2, fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  labelFormatter={v => `Trade #${v} after streak`}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'avg') return [value.toFixed(2), 'Avg P&L']
                    if (name === 'bandHeight')
                      return [`${props.payload.p25.toFixed(2)} to ${props.payload.p75.toFixed(2)}`, '25th-75th pct']
                    return [value, name]
                  }}
                />
                {/* Invisible base area up to p25, then the visible band from p25 to p75 */}
                <Area dataKey="p25" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area
                  dataKey="bandHeight"
                  stackId="band"
                  stroke="none"
                  fill={BAND_COLOR}
                  fillOpacity={0.15}
                  isAnimationActive={false}
                />
                <Line type="monotone" dataKey="avg" stroke={AVG_COLOR} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Time-to-recovery distribution */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Time to Recovery</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Trades needed to get back to breakeven after a losing streak
              {unrecoveredCount > 0 && (
                <span> · {unrecoveredCount} streak{unrecoveredCount > 1 ? 's' : ''} hadn&apos;t recovered yet</span>
              )}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeToRecovery} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} label={{ value: 'Trades to recover', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Streaks" fill={AVG_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
