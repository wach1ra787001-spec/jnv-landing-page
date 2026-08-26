"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  Plus,
  Shuffle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Trash2,
  Play,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatSymbolForTradingView, type TradingViewInterval } from "@/lib/tradingview/utils"

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
  status: "running" | "completed"
  description?: string
  created_at: string
  updated_at: string
  profit_factor?: number
  max_drawdown_pct?: number
}

const TIMEFRAMES: { label: string; value: string }[] = [
  { label: "1 min",   value: "M1"  },
  { label: "5 min",   value: "M5"  },
  { label: "15 min",  value: "M15" },
  { label: "30 min",  value: "M30" },
  { label: "1 hour",  value: "H1"  },
  { label: "4 hours", value: "H4"  },
  { label: "1 day",   value: "D1"  },
  { label: "1 week",  value: "W1"  },
]

const DURATION_CHIPS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
]

const POPULAR_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "NASDAQ:US100"]

// Minimal sparkline generated from running PnL
function Sparkline({ pnl }: { pnl: number }) {
  // Generate a plausible curve shape from the final PnL sign
  const seed = Math.abs(pnl) % 100
  const pts = Array.from({ length: 12 }, (_, i) => {
    const progress = i / 11
    const noise = Math.sin(i * 1.7 + seed) * 0.15
    return { v: (pnl >= 0 ? progress : 1 - progress) * Math.abs(pnl) * (1 + noise) }
  })
  const color = pnl >= 0 ? "#10b981" : "#ef4444"
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={pts} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${pnl}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${pnl})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Win-rate semicircle ring
function WinRateRing({ rate }: { rate: number }) {
  const arc = (rate / 100) * 157
  return (
    <svg width="56" height="36" viewBox="0 0 56 36">
      <defs>
        <linearGradient id="wr-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d="M 4 32 A 24 24 0 0 1 52 32" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth="5" strokeLinecap="round" />
      <path d="M 4 32 A 24 24 0 0 1 52 32" fill="none" stroke="url(#wr-grad)" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${(rate / 100) * 75.4} 75.4`} />
      <text x="28" y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">{rate.toFixed(0)}%</text>
    </svg>
  )
}

function SessionCard({ session, onDelete }: { session: BacktestSession; onDelete: (id: string) => void }) {
  const router = useRouter()
  const pnlDelta = (session.final_balance ?? session.initial_balance) - session.initial_balance
  const pnlPct = session.initial_balance > 0 ? (pnlDelta / session.initial_balance) * 100 : 0
  const isProfit = pnlDelta >= 0

  return (
    <Card
      className="p-0 overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/dashboard/backtest/${session.id}`)}
    >
      {/* Sparkline header */}
      <div className="relative h-12 bg-muted/20">
        <Sparkline pnl={pnlDelta} />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 font-medium border-0",
              session.status === "running"
                ? "bg-chart-1/15 text-chart-1"
                : "bg-primary/15 text-primary"
            )}
          >
            {session.status !== "running" ? (
              <><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Done</>
            ) : (
              <><Clock className="w-2.5 h-2.5 mr-1" />In Progress</>
            )}
          </Badge>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
            onClick={e => { e.stopPropagation(); onDelete(session.id) }}
            title="Delete session"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Name + pair */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate leading-tight">{session.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{session.date_from} — {session.date_to ?? "ongoing"}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono">{session.symbol}</Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{session.timeframe}</Badge>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between gap-2">
          {/* PnL */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">P&L</p>
            <p className={cn("text-base font-bold leading-none", isProfit ? "text-chart-1" : "text-chart-2")}>
              {isProfit ? "+" : ""}${Math.abs(pnlDelta).toFixed(0)}
            </p>
            <p className={cn("text-[10px] mt-0.5 font-medium", isProfit ? "text-chart-1" : "text-chart-2")}>
              {isProfit ? "+" : ""}{pnlPct.toFixed(1)}%
            </p>
          </div>
          {/* Win rate ring */}
          <WinRateRing rate={session.win_rate_pct ?? 0} />
          {/* Trades */}
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Trades</p>
            <p className="text-base font-bold text-foreground leading-none">{session.total_trades}</p>
            <p className="text-[10px] mt-0.5 text-muted-foreground">
              <span className="text-chart-1">{session.winning_trades}W</span>
              {" / "}
              <span className="text-chart-2">{session.losing_trades}L</span>
            </p>
          </div>
        </div>
      </div>

      {/* CTA footer */}
      <div className="px-4 pb-3">
        <Button
          size="sm"
          variant={session.status === "running" ? "default" : "outline"}
          className="w-full h-7 text-xs gap-1.5"
          onClick={e => { e.stopPropagation(); router.push(`/dashboard/backtest/${session.id}/chart`) }}
        >
          {session.status === "running" ? (
            <><Play className="w-3 h-3" />Resume Session</>
          ) : (
            <><BarChart3 className="w-3 h-3" />View Results</>
          )}
        </Button>
      </div>
    </Card>
  )
}

export default function BacktestPage() {
  const [sessions, setSessions] = useState<BacktestSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    timeframe: "H1",
    date_from: "",
    date_to: "",
    initial_balance: "",
    description: "",
  })

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/backtest/sessions", { cache: "no-store" })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 401) throw new Error("Your session has expired. Sign in again to view your backtests.")
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("Retry-After"))
          const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? ` Try again in about ${Math.ceil(retryAfter / 60)} minute${Math.ceil(retryAfter / 60) === 1 ? "" : "s"}.` : ""
          throw new Error(`The request limit was reached.${wait}`)
        }
        throw new Error(payload?.error || "We couldn't load your backtest sessions.")
      }
      setSessions(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error("[v0] Backtest sessions load failed", error)
      setLoadError(error instanceof Error ? error.message : "We couldn't load your backtest sessions.")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleRandomize = () => {
    const days = selectedDuration ?? 30
    const maxHistory = 2 * 365
    const latest = new Date()
    latest.setDate(latest.getDate() - days) // ensure end fits within now
    const maxStartOffset = maxHistory - days
    const startOffset = Math.floor(Math.random() * maxStartOffset) + days
    const start = new Date()
    start.setDate(start.getDate() - startOffset)
    const end = new Date(start)
    end.setDate(end.getDate() + days)
    setForm(f => ({
      ...f,
      date_from: start.toISOString().split("T")[0],
      date_to: end.toISOString().split("T")[0],
    }))
  }

  const handleSubmit = async () => {
    if (submitting || !form.name || !form.symbol || !form.initial_balance) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/backtest/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          initial_balance: parseFloat(form.initial_balance),
          symbol: formatSymbolForTradingView(form.symbol),
        }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        const message = res.status === 429
          ? payload?.code === "MONTHLY_QUOTA_EXCEEDED"
            ? `${payload.error} Your plan allows ${payload.limit} backtest creations per month.`
            : `${payload?.error || "Backtest creation is temporarily rate-limited."} Please wait a moment and try again.`
          : payload?.error || "Could not create the backtest session."
        throw new Error(message)
      }
      const session = payload
      setModalOpen(false)
      setForm({ name: "", symbol: "", timeframe: "H1", date_from: "", date_to: "", initial_balance: "", description: "" })
      window.location.href = `/dashboard/backtest/${session.id}/chart`
    } catch (error) {
      console.error("[v0] Backtest session creation failed", error)
      window.alert(error instanceof Error ? error.message : "Could not create the backtest session.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this backtest session?")) return
    await fetch(`/api/backtest/sessions/${id}`, { method: "DELETE" })
    setSessions(s => s.filter(x => x.id !== id))
  }

  const isEmpty = !loading && !loadError && sessions.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backtest</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practice your strategy against real historical price action before risking real capital.
          </p>
        </div>
        {!isEmpty && !loadError && (
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Session
          </Button>
        )}
      </div>

      {/* Load failure */}
      {!loading && loadError && (
        <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Your backtests couldn&apos;t be loaded</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{loadError}</p>
          </div>
          <Button variant="outline" onClick={fetchSessions}>Try again</Button>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
            <BarChart3 className="w-14 h-14 text-muted-foreground/50 mx-auto" />
          </div>
          <div className="max-w-sm">
            <h2 className="text-xl font-semibold text-foreground mb-2">No backtest sessions yet</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create your first backtesting session to start practicing your strategy on historical data.
            </p>
          </div>
          <Button size="lg" onClick={() => setModalOpen(true)} className="gap-2 px-8">
            <Plus className="w-5 h-5" />
            Add New Session
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-52 animate-pulse bg-muted/30 border-border/40" />
          ))}
        </div>
      )}

      {/* Sessions grid */}
      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* New Session Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Backtest Session</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="bt-name">Session Name <span className="text-destructive">*</span></Label>
              <Input
                id="bt-name"
                placeholder="e.g. London Breakout — EURUSD"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Symbol */}
            <div className="space-y-1.5">
              <Label>Pair / Symbol <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. EURUSD"
                value={form.symbol}
                onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_SYMBOLS.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, symbol: sym }))}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded border transition-colors",
                      form.symbol === sym
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe */}
            <div className="space-y-1.5">
              <Label>Timeframe</Label>
              <Select value={form.timeframe} onValueChange={v => setForm(f => ({ ...f, timeframe: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Date Range</Label>
                <div className="flex items-center gap-1.5">
                  {DURATION_CHIPS.map(d => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setSelectedDuration(d.days)}
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded border transition-colors",
                        selectedDuration === d.days
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs gap-1 px-2"
                    onClick={handleRandomize}
                  >
                    <Shuffle className="w-3 h-3" />
                    Randomize
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Start</p>
                  <Input
                    type="date"
                    value={form.date_from}
                    onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">End</p>
                  <Input
                    type="date"
                    value={form.date_to}
                    onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Starting balance */}
            <div className="space-y-1.5">
              <Label htmlFor="bt-balance">Starting Balance <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="bt-balance"
                  type="number"
                  min={1}
                  placeholder="10000"
                  className="pl-6"
                  value={form.initial_balance}
                  onChange={e => setForm(f => ({ ...f, initial_balance: e.target.value }))}
                />
              </div>
            </div>

            {/* Description (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="bt-desc">Notes (optional)</Label>
              <Textarea
                id="bt-desc"
                placeholder="Strategy rules, goals for this session..."
                className="resize-none h-20"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.name || !form.symbol || !form.initial_balance}
              className="gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
