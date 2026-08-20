'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { JournalEffectResult, getConfidenceLevel } from '@/lib/reflection-analysis-utils'

type Metric = 'rMultiple' | 'winLoss' | 'pnl'

const METRIC_OPTIONS: { key: Metric; label: string }[] = [
  { key: 'rMultiple', label: 'R-Multiple' },
  { key: 'winLoss', label: 'Win / Loss' },
  { key: 'pnl', label: 'PnL' },
]

interface JournalEffectCardProps {
  title: string
  description: string
  data: JournalEffectResult
  leftLabel: string
  rightLabel: string
}

interface PlotPoint {
  x: number
  y: number
  tradeId: string
  date: string
  setup: string | null
  isWin: boolean
  rMultiple: number | null
  pnl: number | null
  group: 'journaled' | 'notJournaled'
}

// Deterministic pseudo-jitter so re-renders don't shuffle dot positions.
function jitterFor(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.5
}

export function JournalEffectCard({ title, description, data, leftLabel, rightLabel }: JournalEffectCardProps) {
  const [metric, setMetric] = useState<Metric>('rMultiple')

  const yValue = (p: { rMultiple: number | null; pnl: number | null; isWin: boolean }): number | null => {
    if (metric === 'rMultiple') return p.rMultiple
    if (metric === 'pnl') return p.pnl
    return p.isWin ? 1 : -1
  }

  const points: PlotPoint[] = useMemo(() => {
    const build = (arr: typeof data.journaled, xBase: number, group: PlotPoint['group']): PlotPoint[] =>
      arr
        .map(p => {
          const y = yValue(p)
          if (y == null) return null
          return {
            x: xBase + jitterFor(p.tradeId),
            y,
            tradeId: p.tradeId,
            date: p.date,
            setup: p.setup,
            isWin: p.isWin,
            rMultiple: p.rMultiple,
            pnl: p.pnl,
            group,
          }
        })
        .filter((p): p is PlotPoint => p !== null)

    return [...build(data.notJournaled, 0, 'notJournaled'), ...build(data.journaled, 1, 'journaled')]
  }, [data, metric])

  const notJournaledMeanY = metric === 'pnl' ? mean(data.notJournaled.map(p => p.pnl)) : metric === 'winLoss' ? (data.notJournaledWinRate != null ? data.notJournaledWinRate / 50 - 1 : null) : data.notJournaledMean
  const journaledMeanY = metric === 'pnl' ? mean(data.journaled.map(p => p.pnl)) : metric === 'winLoss' ? (data.journaledWinRate != null ? data.journaledWinRate / 50 - 1 : null) : data.journaledMean

  function mean(values: (number | null)[]): number | null {
    const nums = values.filter((v): v is number => v != null)
    if (nums.length === 0) return null
    return nums.reduce((a, b) => a + b, 0) / nums.length
  }

  const meanPoints = [
    notJournaledMeanY != null ? { x: 0, y: notJournaledMeanY } : null,
    journaledMeanY != null ? { x: 1, y: journaledMeanY } : null,
  ].filter((p): p is { x: number; y: number } => p !== null)

  const journaledCount = data.journaled.length
  const notJournaledCount = data.notJournaled.length
  const overallConfidence = getConfidenceLevel(data.totalTrades)
  const showInsufficientBanner = journaledCount < 5 || notJournaledCount < 5

  const yLabel = metric === 'rMultiple' ? 'R-Multiple' : metric === 'pnl' ? 'PnL' : 'Win (+1) / Loss (-1)'

  return (
    <Card className="p-6 bg-card border border-border/50">
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {data.totalTrades === 0 ? (
        <p className="text-center text-muted-foreground py-8">No trade data available yet</p>
      ) : overallConfidence === 'insufficient' ? (
        <div className="rounded-md border border-dashed border-border bg-muted/20 py-10 px-4 text-center">
          <AlertTriangle className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Not enough data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            n = {data.totalTrades}. At least 8 trades are needed before this comparison is meaningful.
          </p>
        </div>
      ) : (
        <>
          {showInsufficientBanner && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                One group has fewer than 5 trades. More journaled trades are needed before this pattern is meaningful.
              </p>
            </div>
          )}

          <div className="relative">
            <span className="absolute top-1 right-1 z-10 text-[10px] font-mono text-muted-foreground bg-background/70 px-1.5 py-0.5 rounded">
              n = {data.totalTrades}
            </span>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid
                  strokeDasharray={overallConfidence === 'muted' ? '2 4' : '3 3'}
                  stroke="var(--border)"
                  opacity={overallConfidence === 'muted' ? 0.5 : 1}
                />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[-0.5, 1.5]}
                  ticks={[0, 1]}
                  tickFormatter={v => (v === 0 ? leftLabel : v === 1 ? rightLabel : '')}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  tick={{ fontSize: 11 }}
                  label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                {metric !== 'winLoss' && <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="2 2" />}
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const p = payload[0].payload as PlotPoint
                    return (
                      <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
                        <p className="font-medium text-foreground">{p.group === 'journaled' ? rightLabel : leftLabel}</p>
                        <p className="text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                        {p.setup && <p className="text-muted-foreground">Setup: {p.setup}</p>}
                        {p.rMultiple != null && <p className="text-muted-foreground">R: {p.rMultiple.toFixed(2)}</p>}
                        {p.pnl != null && <p className="text-muted-foreground">PnL: {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}</p>}
                        <p className={p.isWin ? 'text-emerald-500' : 'text-red-500'}>{p.isWin ? 'Win' : 'Loss'}</p>
                      </div>
                    )
                  }}
                />
                <Scatter
                  data={points}
                  fill="#3B7BF8"
                  fillOpacity={overallConfidence === 'muted' ? 0.55 : 0.8}
                  shape={(props: any) => {
                    const color = props.payload.isWin ? '#22C55E' : '#EF4444'
                    return <circle cx={props.cx} cy={props.cy} r={4} fill={color} fillOpacity={overallConfidence === 'muted' ? 0.55 : 0.85} />
                  }}
                />
                {meanPoints.length === 2 && (
                  <Line data={meanPoints} dataKey="y" stroke="#F5F7FA" strokeWidth={2} dot={false} isAnimationActive={false} />
                )}
                {meanPoints.length > 0 && (
                  <Scatter
                    data={meanPoints}
                    dataKey="y"
                    shape={(props: any) => (
                      <path
                        d={`M ${props.cx} ${props.cy - 6} L ${props.cx + 6} ${props.cy} L ${props.cx} ${props.cy + 6} L ${props.cx - 6} ${props.cy} Z`}
                        fill="#F5F7FA"
                        stroke="#0A1628"
                        strokeWidth={1}
                      />
                    )}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">{leftLabel}</p>
              <p className="text-sm font-semibold text-foreground">
                {data.notJournaledMean != null ? `${data.notJournaledMean >= 0 ? '+' : ''}${data.notJournaledMean.toFixed(2)}R avg` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">n = {notJournaledCount}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">{rightLabel}</p>
              <p className="text-sm font-semibold text-foreground">
                {data.journaledMean != null ? `${data.journaledMean >= 0 ? '+' : ''}${data.journaledMean.toFixed(2)}R avg` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">n = {journaledCount}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 border-t border-border/50 pt-3">
            Correlation, not causation — a disciplined trader may both journal more and trade better for unrelated
            reasons.
          </p>
        </>
      )}
    </Card>
  )
}

