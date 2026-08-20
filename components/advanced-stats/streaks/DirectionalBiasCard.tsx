'use client'

import { Card } from '@/components/ui/card'
import { ArrowUp, ArrowDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { DirectionalBiasResult } from '@/lib/streaks-analysis-utils'

interface DirectionalBiasCardProps {
  data: DirectionalBiasResult
}

const LONG_COLOR = '#3b82f6' // blue
const SHORT_COLOR = '#ef4444' // red

interface DivergingRowProps {
  label: string
  longValue: number
  shortValue: number
  formatValue: (v: number) => string
}

function DivergingRow({ label, longValue, shortValue, formatValue }: DivergingRowProps) {
  const maxAbs = Math.max(Math.abs(longValue), Math.abs(shortValue), 1)
  const longWidth = (Math.abs(longValue) / maxAbs) * 100
  const shortWidth = (Math.abs(shortValue) / maxAbs) * 100

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      {/* Short side (left, grows toward center) */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-semibold text-red-600 tabular-nums">{formatValue(shortValue)}</span>
        <div className="h-5 w-full max-w-[140px] flex justify-end">
          <div
            className="h-full rounded-l-sm bg-red-500/80"
            style={{ width: `${shortWidth}%` }}
          />
        </div>
      </div>

      {/* Center label */}
      <div className="px-2 text-center">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}</span>
      </div>

      {/* Long side (right, grows away from center) */}
      <div className="flex items-center justify-start gap-2">
        <div className="h-5 w-full max-w-[140px]">
          <div
            className="h-full rounded-r-sm bg-blue-500/80"
            style={{ width: `${longWidth}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-blue-600 tabular-nums">{formatValue(longValue)}</span>
      </div>
    </div>
  )
}

export function DirectionalBiasCard({ data }: DirectionalBiasCardProps) {
  const { long, short, biasDrift, totalTrades } = data

  const dominantSide = long.trades > short.trades ? 'Long' : short.trades > long.trades ? 'Short' : 'Balanced'
  const longSharePct = totalTrades > 0 ? (long.trades / totalTrades) * 100 : 0

  return (
    <Card className="p-6 bg-card border border-border/50">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-lg font-semibold text-foreground">Directional Bias</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-blue-600">
            <ArrowUp className="w-3 h-3" /> Long
          </span>
          <span className="inline-flex items-center gap-1 text-red-600">
            <ArrowDown className="w-3 h-3" /> Short
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Long vs Short performance, and whether you&apos;re drifting into an unconscious bias
      </p>

      {totalTrades === 0 ? (
        <p className="text-center text-muted-foreground py-8">No directional trades available</p>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Long trades</p>
              <p className="text-lg font-bold text-blue-600">{long.trades}</p>
              <p className="text-xs text-muted-foreground">{longSharePct.toFixed(0)}% of total</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Dominant side</p>
              <p
                className={`text-lg font-bold ${
                  dominantSide === 'Long'
                    ? 'text-blue-600'
                    : dominantSide === 'Short'
                    ? 'text-red-600'
                    : 'text-foreground'
                }`}
              >
                {dominantSide}
              </p>
              <p className="text-xs text-muted-foreground">of {totalTrades} trades</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Short trades</p>
              <p className="text-lg font-bold text-red-600">{short.trades}</p>
              <p className="text-xs text-muted-foreground">{(100 - longSharePct).toFixed(0)}% of total</p>
            </div>
          </div>

          {/* Diverging bars: Win Rate / Avg R / Total PnL */}
          <div className="space-y-4 mb-8">
            <DivergingRow
              label="Win Rate"
              longValue={long.winRate}
              shortValue={short.winRate}
              formatValue={v => `${v.toFixed(0)}%`}
            />
            <DivergingRow
              label="Avg R"
              longValue={long.avgR}
              shortValue={short.avgR}
              formatValue={v => `${v.toFixed(2)}R`}
            />
            <DivergingRow
              label="Total P&L"
              longValue={long.totalPnl}
              shortValue={short.totalPnl}
              formatValue={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}`}
            />
          </div>

          {/* Bias drift line */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Bias Drift Over Time</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Rolling % of trades taken Long — drifting far from 50% signals an unconscious directional bias
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={biasDrift} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  minTickGap={30}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={50} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: 'Balanced', position: 'insideTopRight', fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  labelFormatter={d => new Date(d as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  formatter={(value: number) => [`${value.toFixed(0)}% Long`, 'Bias']}
                />
                <Line type="monotone" dataKey="longPct" stroke={LONG_COLOR} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
