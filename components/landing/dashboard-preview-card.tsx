 "use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, CheckCircle2, ChevronRight } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// Static demo data mirroring real dashboard
const DEMO_METRICS = {
  pnl: 4372.15,
  growthPercent: 12.5,
  growthVsLastMonth: 3.2,
  winRate: 64,
  riskExposure: 2.1,
  consistency: 87,
  documentedTrades: 42,
  totalTrades: 58,
  streakDays: 7,
}

const DEMO_CHART_DATA = [
  { date: "Jun 1",  pnl: 0 },
  { date: "Jun 3",  pnl: 320 },
  { date: "Jun 5",  pnl: 180 },
  { date: "Jun 8",  pnl: 710 },
  { date: "Jun 10", pnl: 640 },
  { date: "Jun 12", pnl: 1120 },
  { date: "Jun 15", pnl: 980 },
  { date: "Jun 17", pnl: 1580 },
  { date: "Jun 20", pnl: 2100 },
  { date: "Jun 22", pnl: 1890 },
  { date: "Jun 24", pnl: 2640 },
  { date: "Jun 26", pnl: 3100 },
  { date: "Jun 28", pnl: 3820 },
  { date: "Jun 30", pnl: 4372 },
]

export function DashboardPreviewCard() {
  const { pnl, growthPercent, growthVsLastMonth, winRate, riskExposure, consistency, documentedTrades, streakDays } = DEMO_METRICS

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-border/50 bg-background shadow-2xl"
      style={{
        transform: "scale(1)",
        transformOrigin: "top center",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {/* Fake browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-card border-b border-border/40">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 mx-4 h-5 rounded bg-muted/40 text-[9px] text-muted-foreground flex items-center justify-center font-mono">
          app.edgetrader.io/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-4 space-y-3 bg-background">

        {/* HeroCard */}
        <Card className="p-3 bg-card border border-border/50 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-sm font-semibold text-foreground">Good Morning, Alex</h1>
              <p className="text-[11px] text-muted-foreground italic">&quot;Consistency compounds. Protect capital first.&quot;</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 border-border/60 pointer-events-none"
                tabIndex={-1}
              >
                Monthly Overview <ChevronRight className="ml-1 h-2.5 w-2.5" />
              </Button>
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] px-2 py-0.5"
              >
                <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                Streak: {streakDays} disciplined days
              </Badge>
            </div>
          </div>
        </Card>

        {/* KPI Cards — 4 column */}
        <div className="grid grid-cols-4 gap-2">
          {/* PnL */}
          <Card className="p-2.5 bg-card border border-border/50 shadow-sm">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total PnL</p>
            <p className="text-sm font-bold text-emerald-500">+${pnl.toLocaleString()}</p>
            <div className="mt-1.5 p-1 rounded bg-emerald-500/10 w-fit">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            </div>
          </Card>

          {/* Growth */}
          <Card className="p-2.5 bg-card border border-border/50 shadow-sm">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Growth</p>
            <p className="text-sm font-bold text-foreground">{growthPercent}%</p>
            <p className="text-[9px] text-emerald-500 mt-0.5 font-medium">+{growthVsLastMonth}% vs last mo.</p>
            <div className="mt-1 p-1 rounded bg-primary/10 w-fit">
              <BarChart3 className="h-3 w-3 text-primary" />
            </div>
          </Card>

          {/* Consistency */}
          <Card className="p-2.5 bg-card border border-border/50 shadow-sm">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Consistency</p>
            <p className="text-sm font-bold text-foreground">{consistency}%</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{documentedTrades} documented</p>
            <div className="mt-1 p-1 rounded bg-primary/10 w-fit">
              <CheckCircle2 className="h-3 w-3 text-primary" />
            </div>
          </Card>

          {/* Win Rate Gauge */}
          <Card className="p-2.5 bg-card border border-border/50 shadow-sm">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Win Rate</p>
            <p className="text-sm font-bold text-foreground">{winRate}%</p>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[9px] px-1.5 py-0 mt-0.5">
              Risk: {riskExposure}%
            </Badge>
            <svg viewBox="0 0 120 70" className="w-full mt-1">
              <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="url(#g2)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(winRate / 100) * 157} 157`}
              />
              <g transform={`rotate(${-90 + (winRate / 100) * 180}, 60, 60)`}>
                <line x1="60" y1="60" x2="60" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="60" r="4" fill="currentColor" />
              </g>
              <defs>
                <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#DC2626" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </Card>
        </div>

        {/* P&L Chart */}
        <Card className="p-3 bg-card border border-border/50 shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">P&L Curve</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DEMO_CHART_DATA} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 10, padding: "4px 8px", borderRadius: 6 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "P&L"]}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="#16a34a"
                strokeWidth={1.5}
                fill="url(#pnlGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </div>
  )
}
