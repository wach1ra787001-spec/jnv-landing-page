'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { computeWinLossDistribution, getAvailableSetupNames, ModelTrade } from '@/lib/models-analysis-utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface WinLossDistributionCardProps {
  trades: ModelTrade[]
}

const WIN_COLOR = '#10b981'
const LOSS_COLOR = '#ef4444'

const SKEW_COPY: Record<string, { label: string; icon: typeof TrendingUp; className: string }> = {
  right: {
    label: 'Right-skewed: a few large winners are driving most of the profit',
    icon: TrendingUp,
    className: 'text-emerald-600',
  },
  left: {
    label: 'Left-skewed: frequent small wins, with occasional large losses',
    icon: TrendingDown,
    className: 'text-red-600',
  },
  balanced: {
    label: 'Balanced distribution: mean and median R are close together',
    icon: Minus,
    className: 'text-muted-foreground',
  },
}

export function WinLossDistributionCard({ trades }: WinLossDistributionCardProps) {
  const setupNames = useMemo(() => getAvailableSetupNames(trades), [trades])
  const [setupFilter, setSetupFilter] = useState<string | null>(null)

  const data = useMemo(() => computeWinLossDistribution(trades, setupFilter), [trades, setupFilter])
  const { bins, meanR, medianR, skew, tradeCount } = data

  const chartData = bins.map(b => ({ ...b, isLoss: b.min < 0 }))
  const skewInfo = skew ? SKEW_COPY[skew] : null
  const SkewIcon = skewInfo?.icon

  return (
    <Card className="p-6 bg-card border border-border/50">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-lg font-semibold text-foreground">Win-Loss Distribution</h3>
        <select
          value={setupFilter ?? ''}
          onChange={e => setSetupFilter(e.target.value || null)}
          className="text-xs rounded-md border border-border/60 bg-background px-2 py-1 text-foreground"
        >
          <option value="">All setups</option>
          {setupNames.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        R-multiple distribution of individual trade outcomes, normalized for cross-setup comparison
      </p>

      {tradeCount === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No R-multiple data available{setupFilter ? ` for ${setupFilter}` : ''}
        </p>
      ) : (
        <>
          {skewInfo && SkewIcon && (
            <div className={`flex items-center gap-2 mb-6 text-sm ${skewInfo.className}`}>
              <SkewIcon className="w-4 h-4 shrink-0" />
              <span>{skewInfo.label}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Trades</p>
              <p className="text-lg font-bold text-foreground">{tradeCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Mean R</p>
              <p className={`text-lg font-bold ${meanR !== null && meanR >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {meanR !== null ? `${meanR >= 0 ? '+' : ''}${meanR.toFixed(2)}R` : '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Median R</p>
              <p className={`text-lg font-bold ${medianR !== null && medianR >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {medianR !== null ? `${medianR >= 0 ? '+' : ''}${medianR.toFixed(2)}R` : '—'}
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="rangeLabel" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <ReferenceLine x="-1R to 0R" stroke="var(--muted-foreground)" strokeDasharray="2 2" />
              {meanR !== null && (
                <ReferenceLine
                  x={bins.find(b => (b.max === null ? meanR >= b.min : meanR >= b.min && meanR < b.max))?.rangeLabel}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: 'Mean', position: 'top', fontSize: 10, fill: '#f59e0b' }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value} trades`, 'Count']}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isLoss ? LOSS_COLOR : WIN_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  )
}
