"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  ArrowLeft,
  Play,
  Copy,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  Trophy,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BacktestTrade {
  id: string
  trade_number: number
  symbol: string
  direction: "buy" | "sell"
  entry_price: number
  exit_price: number
  lot_size: number
  entry_time: string
  exit_time: string
  pnl: number
  net_pnl: number
  balance_after: number
  status: "win" | "loss" | "breakeven"
  notes?: string
  r_multiple?: number
}

interface BacktestSession {
  id: string
  name: string
  symbol: string
  timeframe: string
  date_from: string
  date_to: string
  initial_balance: number
  final_balance: number
  total_net_pnl: number
  win_rate_pct: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  breakeven_trades: number
  status: "running" | "completed" | "draft" | "failed" | "archived"
  profit_factor?: number
  max_drawdown_pct?: number
  best_trade_pnl?: number
  worst_trade_pnl?: number
  description?: string
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string
  value: string
  sub?: string
  icon: any
  color?: string
}) {
  return (
    <Card className="p-4 border border-border/60">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          <p className={cn("text-2xl font-bold leading-none truncate", color ?? "text-foreground")}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("p-2 rounded-lg shrink-0", color ? `bg-${color.replace("text-", "")}/10` : "bg-muted")}>
          <Icon className={cn("w-4 h-4", color ?? "text-muted-foreground")} />
        </div>
      </div>
    </Card>
  )
}

export default function BacktestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<BacktestSession | null>(null)
  const [trades, setTrades] = useState<BacktestTrade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/backtest/sessions/${id}`)
      .then(r => r.json())
      .then(({ session, trades }) => {
        setSession(session)
        setTrades(trades ?? [])
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDuplicate = async () => {
    if (!session) return
    const res = await fetch("/api/backtest/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${session.name} (Copy)`,
        symbol: session.symbol,
        timeframe: session.timeframe,
        date_from: session.date_from,
        date_to: session.date_to,
        initial_balance: session.initial_balance,
      }),
    })
    if (res.ok) {
      const newSession = await res.json()
      router.push(`/dashboard/backtest/${newSession.id}/chart`)
    }
  }

  // Build equity curve from trade balances
  const equityCurve = trades.map((t, i) => ({
    label: `#${t.trade_number}`,
    value: t.balance_after,
  }))
  if (session && equityCurve.length === 0) {
    equityCurve.push({ label: "Start", value: session.initial_balance })
  } else if (session) {
    equityCurve.unshift({ label: "Start", value: session.initial_balance })
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Session not found.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/backtest")}>Back to sessions</Button>
      </div>
    )
  }

  const pnlDelta = (session.final_balance ?? session.initial_balance) - session.initial_balance
  const pnlPct = session.initial_balance > 0 ? (pnlDelta / session.initial_balance) * 100 : 0
  const isProfit = pnlDelta >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.push("/dashboard/backtest")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{session.name}</h1>
              <Badge variant="outline" className="text-xs font-mono">{session.symbol}</Badge>
              <Badge variant="outline" className="text-xs">{session.timeframe}</Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs border-0",
                  session.status === "running" ? "bg-primary/15 text-primary" : "bg-chart-1/15 text-chart-1"
                )}
              >
                {session.status === "running" ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" />Completed</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" />In Progress</>
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{session.date_from} — {session.date_to ?? "ongoing"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </Button>
          {session.status === "running" && (
            <Button size="sm" onClick={() => router.push(`/dashboard/backtest/${id}/chart`)} className="gap-1.5">
              <Play className="w-3.5 h-3.5" />
              Resume Session
            </Button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border border-border/60 col-span-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Net P&L</p>
          <p className={cn("text-2xl font-bold leading-none", isProfit ? "text-chart-1" : "text-chart-2")}>
            {isProfit ? "+" : ""}${Math.abs(pnlDelta).toFixed(2)}
          </p>
          <p className={cn("text-xs mt-1 font-medium", isProfit ? "text-chart-1" : "text-chart-2")}>
            {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
          </p>
        </Card>

        <Card className="p-4 border border-border/60">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-foreground leading-none">{session.win_rate_pct?.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-chart-1">{session.winning_trades}W</span>
            {" / "}
            <span className="text-chart-2">{session.losing_trades}L</span>
            {session.breakeven_trades > 0 && <> / {session.breakeven_trades}BE</>}
          </p>
        </Card>

        <Card className="p-4 border border-border/60">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Trades</p>
          <p className="text-2xl font-bold text-foreground leading-none">{session.total_trades}</p>
          <p className="text-xs text-muted-foreground mt-1">Balance: ${session.final_balance?.toFixed(2)}</p>
        </Card>

        <Card className="p-4 border border-border/60">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Profit Factor</p>
          <p className="text-2xl font-bold text-foreground leading-none">{session.profit_factor?.toFixed(2) ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Max DD: {session.max_drawdown_pct?.toFixed(2) ?? "—"}%</p>
        </Card>
      </div>

      {/* Best / worst trade */}
      {(session.best_trade_pnl != null || session.worst_trade_pnl != null) && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 border border-chart-1/30 bg-chart-1/5 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-chart-1 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Best Trade</p>
              <p className="font-bold text-chart-1">+${session.best_trade_pnl?.toFixed(2)}</p>
            </div>
          </Card>
          <Card className="p-3 border border-chart-2/30 bg-chart-2/5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-chart-2 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Worst Trade</p>
              <p className="font-bold text-chart-2">${session.worst_trade_pnl?.toFixed(2)}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Equity curve */}
      {equityCurve.length > 1 && (
        <Card className="p-5 border border-border/60">
          <h3 className="text-sm font-semibold text-foreground mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={equityCurve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="eq-detail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Balance"]}
              />
              <Area type="monotone" dataKey="value" stroke={isProfit ? "#10b981" : "#ef4444"} strokeWidth={2} fill="url(#eq-detail)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Trade list */}
      {trades.length > 0 && (
        <Card className="border border-border/60 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Trade Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["#", "Symbol", "Dir", "Entry", "Exit", "Lots", "Entry Time", "Exit Time", "P&L", "Balance"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id} className={cn("border-b border-border/20 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/5")}>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{t.trade_number}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{t.symbol}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 border-0 font-medium",
                        t.direction === "buy" ? "bg-chart-1/15 text-chart-1" : "bg-chart-2/15 text-chart-2"
                      )}>
                        {t.direction === "buy" ? "BUY" : "SELL"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{t.entry_price}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{t.exit_price}</td>
                    <td className="px-4 py-2.5 text-xs">{t.lot_size}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {t.entry_time ? new Date(t.entry_time).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {t.exit_time ? new Date(t.exit_time).toLocaleString() : "—"}
                    </td>
                    <td className={cn("px-4 py-2.5 font-bold text-xs", t.pnl >= 0 ? "text-chart-1" : "text-chart-2")}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">${t.balance_after?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {trades.length === 0 && (
        <Card className="p-8 text-center border border-dashed border-border/50">
          <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No trades logged yet in this session.</p>
          {session.status === "running" && (
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => router.push(`/dashboard/backtest/${id}/chart`)}>
              <Play className="w-3.5 h-3.5" />
              Open Chart
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
