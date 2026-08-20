'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Bar,
  BarChart,
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
import { NoteCorrelationResult } from '@/lib/reflection-analysis-utils'

interface NoteCorrelationCardProps {
  data: NoteCorrelationResult
}

const SCATTER_THRESHOLD = 40

export function NoteCorrelationCard({ data }: NoteCorrelationCardProps) {
  const [view, setView] = useState<'auto' | 'scatter' | 'binned'>('auto')

  const resolvedView = view === 'auto' ? (data.correlation.n > SCATTER_THRESHOLD ? 'scatter' : 'binned') : view

  const scatterData = useMemo(
    () => data.trades.map(t => ({ x: t.noteDetailScore, y: t.rMultiple, ...t })),
    [data.trades]
  )

  return (
    <Card className="p-6 bg-card border border-border/50">
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">Note Correlation</h3>
        <div className="flex gap-1 rounded-md border border-border/60 p-0.5">
          {(['auto', 'scatter', 'binned'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setView(opt)}
              className={`px-2 py-1 rounded-sm text-xs font-medium capitalize transition-colors ${
                view === opt ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">How detailed notes correlate with profitable trades</p>

      {data.correlation.n === 0 ? (
        <p className="text-center text-muted-foreground py-8">No trades with an R-multiple and notes yet</p>
      ) : (
        <>
          <div className="relative">
            <span className="absolute top-1 right-1 z-10 text-[10px] font-mono text-muted-foreground bg-background/70 px-1.5 py-0.5 rounded">
              n = {data.correlation.n}
            </span>

            {resolvedView === 'scatter' ? (
              <>
                <div className="mb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    r = {data.correlation.r != null ? data.correlation.r.toFixed(2) : '—'}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Note detail score', position: 'insideBottom', offset: -8, fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      tick={{ fontSize: 11 }}
                      label={{ value: 'R-Multiple', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <ZAxis range={[40, 40]} />
                    <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null
                        const p = payload[0].payload as (typeof scatterData)[number]
                        return (
                          <div className="max-w-[220px] rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
                            <p className="text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                            {p.setup && <p className="text-muted-foreground">Setup: {p.setup}</p>}
                            <p className="text-muted-foreground">R: {p.rMultiple.toFixed(2)}</p>
                            <p className="text-muted-foreground">{p.noteWordCount} words</p>
                            {p.noteExcerpt && <p className="text-foreground mt-1 italic">&ldquo;{p.noteExcerpt}&rdquo;</p>}
                          </div>
                        )
                      }}
                    />
                    <Scatter data={scatterData} fill="#3B7BF8" fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.bins} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: 'Avg R-Multiple', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const p = payload[0].payload as (typeof data.bins)[number]
                      return (
                        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
                          <p className="font-medium text-foreground">{p.label} detail</p>
                          <p className="text-muted-foreground">Avg R: {p.avgR != null ? p.avgR.toFixed(2) : '—'}</p>
                          <p className="text-muted-foreground">{p.count} trades</p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="avgR"
                    radius={[4, 4, 0, 0]}
                    shape={(props: any) => {
                      const value = props.payload.avgR ?? 0
                      const color = value >= 0 ? '#22C55E' : '#EF4444'
                      return <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={color} fillOpacity={0.8} rx={4} />
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {data.bins.map(b => (
              <div key={b.label} className="rounded-md border border-border/50 bg-muted/20 px-2 py-2 text-center">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className="text-sm font-semibold text-foreground">{b.avgR != null ? `${b.avgR >= 0 ? '+' : ''}${b.avgR.toFixed(2)}R` : '—'}</p>
                <p className="text-[10px] text-muted-foreground">n = {b.count}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 border-t border-border/50 pt-3">
            Correlation ≠ causation. A trader who only writes detailed notes on trades they already feel confident
            about will show a &ldquo;correlation&rdquo; that reflects confidence, not proof that journaling causes
            profit.
          </p>
        </>
      )}
    </Card>
  )
}
