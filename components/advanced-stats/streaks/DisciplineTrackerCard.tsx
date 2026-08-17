'use client'

import { Card } from '@/components/ui/card'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { DisciplineTrackerResult } from '@/lib/streaks-analysis-utils'
import { AlertTriangle, ShieldCheck } from 'lucide-react'

interface DisciplineTrackerCardProps {
  data: DisciplineTrackerResult
}

const ROLLING_COLOR = '#8b5cf6' // violet
const VIOLATION_COLOR = '#ef4444' // red

function cellColor(adherencePct: number | null): string {
  if (adherencePct === null) return 'rgba(148, 163, 184, 0.14)' // muted, no journal data
  if (adherencePct >= 90) return '#059669'
  if (adherencePct >= 75) return '#10b981'
  if (adherencePct >= 60) return '#34d399'
  if (adherencePct >= 40) return '#fbbf24'
  if (adherencePct >= 20) return '#f97316'
  return '#dc2626'
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DisciplineTrackerCard({ data }: DisciplineTrackerCardProps) {
  const { calendarWeeks, rollingSeries, avgAdherencePct, totalHardViolations, journaledDays, totalTradingDays } = data

  const hasData = calendarWeeks.length > 0

  // Determine which weeks should show a month label (first week that
  // contains the 1st-7th of a new month).
  const monthLabelForWeek = new Map<number, string>()
  let lastMonth = -1
  calendarWeeks.forEach((week, wi) => {
    const firstRealDay = week.find(d => d !== null)
    if (!firstRealDay) return
    const month = new Date(firstRealDay.date + 'T00:00:00Z').getUTCMonth()
    if (month !== lastMonth) {
      monthLabelForWeek.set(wi, MONTH_LABELS[month])
      lastMonth = month
    }
  })

  return (
    <Card className="p-6 bg-card border border-border/50">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-lg font-semibold text-foreground">Discipline Tracker</h3>
        {totalHardViolations > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" /> {totalHardViolations} hard violation
            {totalHardViolations > 1 ? 's' : ''}
          </span>
        ) : journaledDays > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" /> No violations
          </span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Day-by-day plan adherence, with rule violations flagged and the trend line showing whether it&apos;s improving
      </p>

      {!hasData ? (
        <p className="text-center text-muted-foreground py-8">No trades available</p>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg adherence</p>
              <p className="text-lg font-bold text-foreground">
                {avgAdherencePct !== null ? `${avgAdherencePct.toFixed(0)}%` : '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Journaled days</p>
              <p className="text-lg font-bold text-foreground">
                {journaledDays}
                <span className="text-xs font-normal text-muted-foreground">/{totalTradingDays}</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Hard violations</p>
              <p className={`text-lg font-bold ${totalHardViolations > 0 ? 'text-red-600' : 'text-foreground'}`}>
                {totalHardViolations}
              </p>
            </div>
          </div>

          {/* Calendar heatmap */}
          <div className="mb-8 overflow-x-auto">
            <h4 className="text-sm font-semibold text-foreground mb-3">Adherence Calendar</h4>
            <TooltipProvider delayDuration={100}>
              <div className="inline-flex gap-2">
                {/* Day-of-week labels */}
                <div className="flex flex-col gap-[3px] pt-4">
                  {DAY_LABELS.map((label, i) => (
                    <span
                      key={label}
                      className="h-[13px] text-[10px] leading-[13px] text-muted-foreground"
                      style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="flex gap-[3px]">
                  {calendarWeeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      <span className="h-4 text-[10px] text-muted-foreground whitespace-nowrap">
                        {monthLabelForWeek.get(wi) ?? ''}
                      </span>
                      {week.map((day, di) =>
                        day === null ? (
                          <div key={di} className="w-[13px] h-[13px]" />
                        ) : (
                          <UiTooltip key={di}>
                            <TooltipTrigger asChild>
                              <div
                                className="relative w-[13px] h-[13px] rounded-[2px] cursor-default transition-transform hover:scale-125"
                                style={{ backgroundColor: cellColor(day.adherencePct) }}
                              >
                                {day.hardViolation && (
                                  <div
                                    className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full border border-background"
                                    style={{ backgroundColor: VIOLATION_COLOR }}
                                  />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">
                                {new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              {day.tradeCount > 0 ? (
                                <>
                                  <p>
                                    {day.adherencePct !== null
                                      ? `${day.adherencePct.toFixed(0)}% adherence`
                                      : 'Not journaled'}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {day.tradeCount} trade{day.tradeCount > 1 ? 's' : ''}
                                  </p>
                                  {day.hardViolation && <p className="text-red-500">Rule violation</p>}
                                </>
                              ) : (
                                <p className="text-muted-foreground">No trades</p>
                              )}
                            </TooltipContent>
                          </UiTooltip>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TooltipProvider>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span>Low</span>
              <span className="flex gap-[3px]">
                {[0, 20, 40, 60, 80, 100].map(v => (
                  <span key={v} className="w-[13px] h-[13px] rounded-[2px]" style={{ backgroundColor: cellColor(v) }} />
                ))}
              </span>
              <span>High</span>
              <span className="inline-flex items-center gap-1.5 ml-3">
                <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: VIOLATION_COLOR }} /> Hard
                violation
              </span>
            </div>
          </div>

          {/* Rolling adherence line */}
          {rollingSeries.length > 1 ? (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Rolling Adherence Trend</h4>
              <p className="text-xs text-muted-foreground mb-3">
                7-journaled-day rolling average — red dots mark days with a hard rule violation
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={rollingSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    minTickGap={30}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <ReferenceLine y={80} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: 'Target', position: 'insideTopRight', fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelFormatter={d => new Date((d as string) + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, 'Rolling adherence']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingAdherencePct"
                    stroke={ROLLING_COLOR}
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props
                      if (!payload.hardViolation) return <g key={`dot-${index}`} />
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={VIOLATION_COLOR}
                          stroke="var(--background)"
                          strokeWidth={1.5}
                        />
                      )
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-4">
              Journal more trades (followed plan / discipline rating) to see the adherence trend
            </p>
          )}
        </>
      )}
    </Card>
  )
}
