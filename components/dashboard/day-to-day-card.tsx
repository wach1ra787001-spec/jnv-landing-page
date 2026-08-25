"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  BookCheck,
  Flame,
  Minus,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
} from "recharts"
import type { DayToDaySnapshot, SevenDayTrendPoint } from "@/lib/day-to-day-analysis"

interface DayToDayCardProps {
  snapshot: DayToDaySnapshot
  trend: SevenDayTrendPoint[]
  currency: string
  weekOptions: { value: string; label: string }[]
  selectedWeek: string
}

function MetricBlock({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string
  value: string
  sub?: string
  tone?: "positive" | "negative" | "neutral"
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
        {label}
      </p>
      <p
        className={cn(
          "text-base sm:text-lg font-bold truncate",
          tone === "positive" && "text-chart-1",
          tone === "negative" && "text-chart-2",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
  )
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof Target
  title: string
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
    </div>
  )
}

const journalStatusConfig: Record<
  DayToDaySnapshot["journalStatus"],
  { label: string; className: string }
> = {
  completed: { label: "Journal complete", className: "bg-chart-1/10 text-chart-1" },
  partial: { label: "Journal partial", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  incomplete: { label: "Journal incomplete", className: "bg-chart-2/10 text-chart-2" },
  no_trades: { label: "No trades yet", className: "bg-muted text-muted-foreground" },
}

export function DayToDayCard({ snapshot, trend, currency, weekOptions, selectedWeek }: DayToDayCardProps) {
  const {
    hasTrades,
    pnlAmount,
    pnlPercent,
    totalR,
    tradesTaken,
    wins,
    losses,
    winRate,
    avgR,
    plannedRiskPercent,
    actualRiskPercent,
    disciplineScore,
    dailyDrawdown,
    currentStreak,
    sessions,
    journalStatus,
    insight,
  } = snapshot

  const pnlTone = pnlAmount > 0 ? "positive" : pnlAmount < 0 ? "negative" : "neutral"
  const journalConfig = journalStatusConfig[journalStatus]
  const riskOverBudget = plannedRiskPercent > 0 && actualRiskPercent > plannedRiskPercent

  return (
    <Card className="p-4 sm:p-6 bg-card border border-border/50 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Day-to-Day</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your daily trading health check</p>
        </div>
        <div className="flex items-center gap-2 shrink-0"><Select defaultValue={selectedWeek} onValueChange={(value) => { const url = new URL(window.location.href); url.searchParams.set('dayWeek', value); window.location.href = url.toString() }}><SelectTrigger className="h-8 w-[132px] text-xs"><SelectValue placeholder="Select week" /></SelectTrigger><SelectContent>{weekOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Badge variant="secondary" className={cn("shrink-0 text-[10px] sm:text-xs border-0", journalConfig.className)}>
          {journalConfig.label}
        </Badge></div>
      </div>

      {!hasTrades ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Minus className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No trades closed today</p>
          <p className="text-xs text-muted-foreground max-w-xs">{insight}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Results */}
          <div>
            <SectionHeading icon={Target} title="Results" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <MetricBlock
                label="Today's P&L"
                value={`${pnlAmount >= 0 ? "+" : ""}${formatCurrency(pnlAmount, currency)}`}
                sub={`${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}% · ${totalR >= 0 ? "+" : ""}${totalR.toFixed(2)}R`}
                tone={pnlTone}
              />
              <MetricBlock
                label="Trades Taken"
                value={String(tradesTaken)}
                sub={`${wins}W / ${losses}L`}
              />
              <MetricBlock label="Win Rate" value={`${winRate.toFixed(0)}%`} />
              <MetricBlock label="Avg R" value={`${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R`} />
            </div>
          </div>

          {/* Risk */}
          <div>
            <SectionHeading icon={ShieldAlert} title="Risk" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                  Risk Used
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-base sm:text-lg font-bold",
                      riskOverBudget ? "text-chart-2" : "text-foreground",
                    )}
                  >
                    {actualRiskPercent.toFixed(2)}%
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    of {plannedRiskPercent.toFixed(2)}% planned
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full max-w-[140px] rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", riskOverBudget ? "bg-chart-2" : "bg-primary")}
                    style={{
                      width: `${plannedRiskPercent > 0 ? Math.min((actualRiskPercent / plannedRiskPercent) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <MetricBlock
                label="Daily Drawdown"
                value={formatCurrency(dailyDrawdown, currency)}
                tone={dailyDrawdown < 0 ? "negative" : "neutral"}
              />
              <div className="min-w-0 col-span-2 sm:col-span-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                  Current Streak
                </p>
                <div className="flex items-center gap-1.5">
                  {currentStreak.type === "win" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-chart-1" />
                  ) : currentStreak.type === "loss" ? (
                    <TrendingDown className="h-3.5 w-3.5 text-chart-2" />
                  ) : (
                    <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "text-base sm:text-lg font-bold",
                      currentStreak.type === "win" && "text-chart-1",
                      currentStreak.type === "loss" && "text-chart-2",
                      currentStreak.type === "none" && "text-foreground",
                    )}
                  >
                    {currentStreak.count > 0
                      ? `${currentStreak.count}${currentStreak.type === "win" ? "W" : "L"}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Discipline */}
          <div>
            <SectionHeading icon={BookCheck} title="Discipline" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      className={disciplineScore >= 70 ? "text-chart-1" : disciplineScore >= 40 ? "text-amber-500" : "text-chart-2"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(disciplineScore / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">{disciplineScore.toFixed(0)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Discipline score</p>
                  <p className="text-[10px] text-muted-foreground">Rule adherence today</p>
                </div>
              </div>

              {sessions.length > 0 && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Session Breakdown
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sessions.map((session) => (
                      <div
                        key={session.label}
                        className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1"
                      >
                        <span className="text-[11px] font-medium text-foreground">{session.label}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{session.trades} trades</span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            session.pnl >= 0 ? "text-chart-1" : "text-chart-2",
                          )}
                        >
                          {session.pnl >= 0 ? "+" : ""}
                          {formatCurrency(session.pnl, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insight */}
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      {/* 7-day mini trend */}
      <div className="mt-6 pt-5 border-t border-border/50">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          7-Day Trend
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">P&L</p>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {trend.map((point, index) => (
                      <Cell
                        key={index}
                        fill={
                          !point.hasTrades
                            ? "hsl(var(--muted))"
                            : point.pnl >= 0
                              ? "hsl(var(--chart-1))"
                              : "hsl(var(--chart-2))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Win Rate</p>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Discipline</p>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Line
                    type="monotone"
                    dataKey="discipline"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-1.5">
          {trend.map((point) => (
            <span key={point.label} className="text-[9px] text-muted-foreground">
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}
