'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { BiasEffectsResult, DirectionCell } from '@/lib/models-analysis-utils'

interface BiasEffectsCardProps {
  data: BiasEffectsResult
}

type Metric = 'winRate' | 'avgR' | 'expectancy'

const METRIC_OPTIONS: { key: Metric; label: string; format: (v: number) => string }[] = [
  { key: 'winRate', label: 'Win Rate', format: v => `${v.toFixed(0)}%` },
  { key: 'avgR', label: 'Avg R', format: v => `${v.toFixed(2)}R` },
  { key: 'expectancy', label: 'Expectancy', format: v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}` },
]

function cellColor(value: number, min: number, max: number, lowSample: boolean): string {
  if (lowSample) return 'rgba(148, 163, 184, 0.16)'
  if (max - min < 1e-9) return 'rgba(148, 163, 184, 0.25)'
  const t = (value - min) / (max - min)
  // Red -> slate -> green
  if (t < 0.5) {
    const ratio = t / 0.5
    return `rgba(${239 - ratio * (239 - 148)}, ${68 + ratio * (163 - 68)}, ${68 + ratio * (184 - 68)}, 0.85)`
  }
  const ratio = (t - 0.5) / 0.5
  return `rgba(${148 - ratio * (148 - 16)}, ${163 + ratio * (185 - 163)}, ${184 - ratio * (184 - 76)}, 0.85)`
}

export function BiasEffectsCard({ data }: BiasEffectsCardProps) {
  const { matrix, correlation } = data
  const [metric, setMetric] = useState<Metric>('winRate')

  const metricDef = METRIC_OPTIONS.find(m => m.key === metric)!

  const { min, max } = useMemo(() => {
    const values: number[] = []
    for (const row of matrix) {
      if (row.long.count > 0) values.push(row.long[metric])
      if (row.short.count > 0) values.push(row.short[metric])
    }
    return { min: values.length ? Math.min(...values) : 0, max: values.length ? Math.max(...values) : 0 }
  }, [matrix, metric])

  function renderCell(cell: DirectionCell) {
    if (cell.count === 0) {
      return (
        <div className="w-full h-14 rounded-md border border-border/40 flex items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      )
    }
    return (
      <UiTooltip>
        <TooltipTrigger asChild>
          <div
            className={`w-full h-14 rounded-md flex flex-col items-center justify-center cursor-default ${
              cell.lowSample ? 'border border-dashed border-border' : ''
            }`}
            style={{ backgroundColor: cellColor(cell[metric], min, max, cell.lowSample) }}
          >
            <span className="text-sm font-semibold text-foreground">{metricDef.format(cell[metric])}</span>
            <span className="text-[10px] text-muted-foreground">{cell.count} trades</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Win rate: {cell.winRate.toFixed(0)}%</p>
          <p>Avg R: {cell.avgR.toFixed(2)}R</p>
          <p>Expectancy: {cell.expectancy.toFixed(2)}</p>
          {cell.lowSample && <p className="text-muted-foreground">Low sample size (n={cell.count})</p>}
        </TooltipContent>
      </UiTooltip>
    )
  }

  return (
    <Card className="p-6 bg-card border border-border/50">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-lg font-semibold text-foreground">Bias Effects</h3>
        <div className="flex gap-1 rounded-md border border-border/60 p-0.5">
          {METRIC_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setMetric(opt.key)}
              className={`px-2 py-1 rounded-sm text-xs font-medium transition-colors ${
                metric === opt.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        How your directional bias interacts with each setup&apos;s profitability
      </p>

      {matrix.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No directional trade data available</p>
      ) : (
        <>
          {/* Heatmap matrix */}
          <TooltipProvider delayDuration={100}>
            <div className="mb-8">
              <div className="grid grid-cols-[minmax(0,1fr)_repeat(2,90px)] gap-2 mb-2 text-xs text-muted-foreground font-medium">
                <span />
                <span className="text-center">Long</span>
                <span className="text-center">Short</span>
              </div>
              <div className="space-y-2">
                {matrix.map(row => (
                  <div key={row.setupId} className="grid grid-cols-[minmax(0,1fr)_repeat(2,90px)] gap-2 items-center">
                    <span className="text-sm font-medium text-foreground truncate">{row.name}</span>
                    {renderCell(row.long)}
                    {renderCell(row.short)}
                  </div>
                ))}
              </div>
            </div>
          </TooltipProvider>

          {/* Scatter: bias skew vs profitability */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Bias Skew vs. Profitability</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Bubble size = trade count. Points far from the 50% line show a strong directional lean within that setup.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  dataKey="longPct"
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 11 }}
                  label={{ value: '% of trades Long', position: 'insideBottom', offset: -5, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="expectancy"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Expectancy', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="tradeCount" range={[60, 400]} />
                <ReferenceLine x={50} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: 'Neutral', position: 'insideTopRight', fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const p = payload[0].payload as (typeof correlation)[number]
                    return (
                      <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-muted-foreground">{p.longPct.toFixed(0)}% long</p>
                        <p className="text-muted-foreground">Expectancy: {p.expectancy.toFixed(2)}</p>
                        <p className="text-muted-foreground">{p.tradeCount} trades</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={correlation} fill="#3d52d5" fillOpacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
