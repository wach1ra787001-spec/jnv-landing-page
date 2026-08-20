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
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { ProfitFactorResult } from '@/lib/models-analysis-utils'

interface ProfitFactorAnalysisCardProps {
  data: ProfitFactorResult
}

function pfColor(pf: number): string {
  const clamped = Math.max(0, Math.min(pf, 3))
  if (clamped < 1) {
    // below breakeven: pale red -> strong red as it drops further from 1
    const t = Math.min((1 - clamped) / 1, 1)
    return `rgba(239, 68, 68, ${0.35 + t * 0.55})`
  }
  // above breakeven: pale green -> strong green as it climbs
  const t = Math.min((clamped - 1) / 2, 1)
  return `rgba(16, 185, 129, ${0.3 + t * 0.65})`
}

export function ProfitFactorAnalysisCard({ data }: ProfitFactorAnalysisCardProps) {
  const { strategies } = data
  const [bubbleSize, setBubbleSize] = useState<'tradeCount' | 'netPnl'>('tradeCount')

  const barData = useMemo(() => [...strategies].sort((a, b) => b.profitFactor - a.profitFactor), [strategies])
  const bubbleData = useMemo(
    () => strategies.map(s => ({ ...s, sizeMetric: bubbleSize === 'tradeCount' ? s.tradeCount : Math.abs(s.netPnl) })),
    [strategies, bubbleSize]
  )

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-1">Profit Factor Analysis</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Ranked by profit factor, with 1.0 as the breakeven line — deeper color means further from breakeven
      </p>

      {strategies.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No strategy data available</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(220, barData.length * 44)}>
            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <ReferenceLine x={1} stroke="var(--foreground)" strokeWidth={1.5} label={{ value: 'Breakeven', position: 'top', fontSize: 11, fill: 'var(--foreground)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(value: number, _name, entry: any) => [
                  `${value.toFixed(2)}${entry?.payload?.lowSample ? ' (low n)' : ''}`,
                  'Profit Factor',
                ]}
              />
              <Bar dataKey="profitFactor" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={pfColor(entry.profitFactor)} stroke={entry.lowSample ? 'var(--border)' : undefined} strokeDasharray={entry.lowSample ? '3 2' : undefined} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Bubble chart */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-foreground">Profit Factor vs. Win Rate</h4>
              <div className="flex gap-1 rounded-md border border-border/60 p-0.5">
                {(['tradeCount', 'netPnl'] as const).map(key => (
                  <button
                    key={key}
                    onClick={() => setBubbleSize(key)}
                    className={`px-2 py-1 rounded-sm text-xs font-medium transition-colors ${
                      bubbleSize === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {key === 'tradeCount' ? 'Trade count' : 'Net PnL'}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Shows how each strategy achieves its edge — high win rate with small wins, or low win rate with big winners
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  dataKey="profitFactor"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Profit Factor', position: 'insideBottom', offset: -5, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="winRate"
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Win Rate', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="sizeMetric" range={[60, 400]} />
                <ReferenceLine x={1} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const p = payload[0].payload as (typeof bubbleData)[number]
                    return (
                      <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-muted-foreground">PF: {p.profitFactor.toFixed(2)}</p>
                        <p className="text-muted-foreground">Win rate: {p.winRate.toFixed(0)}%</p>
                        <p className="text-muted-foreground">{p.tradeCount} trades</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={bubbleData} fill="#3d52d5" fillOpacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
