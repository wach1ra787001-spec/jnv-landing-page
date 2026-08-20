"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Loader2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronFirst,
  ChevronLast,
  Gauge,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TradingViewChart } from "@/components/tradingview-chart"
import { createReplayDatafeed, type ReplayController } from "@/lib/tradingview/replay-datafeed"
import { normalizeExternalBars } from "@/lib/tradingview/replay-utils"
import type { TradingViewInterval } from "@/lib/tradingview/utils"

interface Session {
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
  status: "running" | "completed" | "draft" | "failed" | "archived"
}

const DB_TO_TV: Record<string, TradingViewInterval> = {
  M1: "1", M5: "5", M15: "15", M30: "30",
  H1: "60", H4: "240", D1: "1D", W1: "1W", MN: "1M",
}

// Databento only has native OHLCV schemas at 1s/1m/1h/1d resolution. Sub-hour
// timeframes that aren't 1m (M5, M15, M30) and 4h are derived client-side by
// aggregating 1m or 1h bars — there is no ohlcv-5m/15m/30m/4h schema to request.
const TIMEFRAME_TO_DATABENTO_SCHEMA: Record<string, { schema: string; aggregateMinutes?: number }> = {
  M1: { schema: "ohlcv-1m" },
  M5: { schema: "ohlcv-1m", aggregateMinutes: 5 },
  M15: { schema: "ohlcv-1m", aggregateMinutes: 15 },
  M30: { schema: "ohlcv-1m", aggregateMinutes: 30 },
  H1: { schema: "ohlcv-1h" },
  H4: { schema: "ohlcv-1h", aggregateMinutes: 240 },
  D1: { schema: "ohlcv-1d" },
  W1: { schema: "ohlcv-1d", aggregateMinutes: 7 * 24 * 60 },
}

function aggregateBars(bars: { time: number; open: number; high: number; low: number; close: number; volume: number }[], minutes: number) {
  if (!minutes || minutes <= 1 || !bars.length) return bars
  const bucketSeconds = minutes * 60
  const buckets = new Map<number, typeof bars>()
  for (const bar of bars) {
    const bucketStart = Math.floor(bar.time / bucketSeconds) * bucketSeconds
    const list = buckets.get(bucketStart)
    if (list) list.push(bar)
    else buckets.set(bucketStart, [bar])
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, group]) => ({
      time,
      open: group[0].open,
      high: Math.max(...group.map((b) => b.high)),
      low: Math.min(...group.map((b) => b.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, b) => sum + b.volume, 0),
    }))
}

const TIMEFRAMES: { label: string; dbValue: string; tvValue: TradingViewInterval }[] = [
  { label: "1m",  dbValue: "M1",  tvValue: "1"   },
  { label: "5m",  dbValue: "M5",  tvValue: "5"   },
  { label: "15m", dbValue: "M15", tvValue: "15"  },
  { label: "30m", dbValue: "M30", tvValue: "30"  },
  { label: "1h",  dbValue: "H1",  tvValue: "60"  },
  { label: "4h",  dbValue: "H4",  tvValue: "240" },
  { label: "1D",  dbValue: "D1",  tvValue: "1D"  },
  { label: "1W",  dbValue: "W1",  tvValue: "1W"  },
]

const SPEEDS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x",   value: 1   },
  { label: "2x",   value: 2   },
  { label: "5x",   value: 5   },
  { label: "10x",  value: 10  },
]

function formatReplayTime(unixSec: number): string {
  if (!unixSec) return "--"
  return new Date(unixSec * 1000).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
}

export default function BacktestChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // ── Session ───────────────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [interval, setInterval] = useState<TradingViewInterval>("60")

  // ── Replay state ──────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [barIndex, setBarIndex] = useState(1)
  const [totalBars, setTotalBars] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)

  // Stable refs — never trigger re-renders
  const controllerRef = useRef<ReplayController | null>(null)
  const widgetRef = useRef<any>(null)
  // The datafeed object is kept stable for the life of symbol+interval
  const datafeedRef = useRef<object | null>(null)
  const barsRef = useRef<any[]>([])
  // Key forces TradingViewChart to fully remount when symbol/interval changes
  const [chartKey, setChartKey] = useState(0)

  // ── Modals ────────────────────────────────────────────────────────────────
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [endModalOpen, setEndModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [endingSession, setEndingSession] = useState(false)
  const [tradeForm, setTradeForm] = useState({
    direction: "buy" as "buy" | "sell",
    entry_price: "", exit_price: "", lot_size: "0.1",
    stop_loss: "", take_profit: "", entry_time: "", exit_time: "", notes: "",
  })

  // ── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function loadSessionAndBars() {
      try {
        setLoadError(null)
        const sessionResponse = await fetch(`/api/backtest/sessions/${id}`)
        const sessionPayload = await sessionResponse.json().catch(() => null)
        if (!sessionResponse.ok) throw new Error(sessionPayload?.error || "Could not load this backtest session")
        const { session: s } = sessionPayload
        if (cancelled) return
        setSession(s)
        const tvInterval = DB_TO_TV[s?.timeframe] ?? "60"
        setInterval(tvInterval)

        const start = Math.floor(new Date(s?.date_from ?? Date.now() - 30 * 86400000).getTime() / 1000)
        const end = Math.floor(new Date(s?.date_to ?? Date.now()).getTime() / 1000)
        const schemaMapping = TIMEFRAME_TO_DATABENTO_SCHEMA[s?.timeframe] ?? TIMEFRAME_TO_DATABENTO_SCHEMA.M1
        const params = new URLSearchParams({
          symbol: s?.symbol ?? "EURUSD",
          schema: schemaMapping.schema,
          start: String(start),
          end: String(end),
          limit: "5000",
        })
        console.log('[v0] Backtest Databento request', {
          sessionId: id, symbol: s?.symbol, providerSymbol: params.get('symbol'),
          timeframe: s?.timeframe, schema: schemaMapping.schema, aggregateMinutes: schemaMapping.aggregateMinutes ?? null,
          start: params.get('start'), end: params.get('end'), limit: params.get('limit'),
        })
        const response = await fetch(`/api/databento/ohlc?${params.toString()}`, { cache: "no-store" })
        const payload = await response.json().catch(() => null)
        console.log('[v0] Backtest Databento response', {
          sessionId: id, status: response.status, provider: payload?.provider,
          returnedCount: payload?.count ?? payload?.bars?.length ?? null,
          payloadStart: payload?.start, payloadEnd: payload?.end,
        })
        if (!response.ok) {
          if (response.status === 503) {
            throw new Error("Databento is not configured in this deployment. Add DATABENTO_API_KEY to the Vercel Preview/Production environment, then redeploy.")
          }
          if (response.status === 422 && payload?.code === "INSTRUMENT_MAPPING_MISSING") {
            throw new Error(`No Databento market mapping is configured for ${payload.symbol}.`)
          }
          throw new Error(payload?.error || "Could not load market data")
        }
        const normalizedBars = normalizeExternalBars(payload?.bars ?? [])
        const bars = schemaMapping.aggregateMinutes
          ? aggregateBars(normalizedBars, schemaMapping.aggregateMinutes)
          : normalizedBars
        console.log('[v0] Backtest bars normalized for replay', {
          sessionId: id, inputCount: payload?.bars?.length ?? 0, normalizedCount: normalizedBars.length, outputCount: bars.length,
          firstTime: bars[0]?.time ?? null, lastTime: bars[bars.length - 1]?.time ?? null,
        })
        if (!bars.length) throw new Error("Databento returned no valid OHLC bars")
        if (cancelled) return
        console.log('[v0] Databento bars ready for replay', {
          symbol: s?.symbol,
          providerSymbol: params.get('symbol'),
          count: bars.length,
          firstTime: bars[0]?.time,
          lastTime: bars[bars.length - 1]?.time,
        })
        barsRef.current = bars
        initDatafeed(s?.symbol ?? "EURUSD", tvInterval, bars)
      } catch (error) {
        console.error('[v0] Backtest OHLC pipeline failed', error)
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load this backtest")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadSessionAndBars()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Init / reinit datafeed ────────────────────────────────────────────────
  function initDatafeed(sym: string, ivl: string, bars = barsRef.current) {
    // Pause any existing controller
    controllerRef.current?.pause()

    const { datafeed, controller } = createReplayDatafeed({
      symbol: sym,
      interval: ivl,
      bars,
      onTick: (time, idx, total) => {
        setCurrentTime(time)
        setBarIndex(idx)
        setTotalBars(total)
        setIsPlaying(controller.isPlaying())
      },
      onNeedReset: () => {
        // Called by stepBack / jumpTo-backward — reset chart data so it
        // re-requests getBars() from the new cursor position
        try {
          widgetRef.current?.chart()?.resetData()
        } catch (_) {}
      },
    })

    controllerRef.current = controller
    datafeedRef.current = datafeed

    // Sync initial display state
    setBarIndex(controller.currentIndex())
    setTotalBars(controller.totalBars())
    setCurrentTime(controller.currentTime())
    setIsPlaying(false)

    // Bump key to force TradingViewChart remount with new datafeed
    setChartKey(k => k + 1)
  }

  // ── Playback handlers ─────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const ctrl = controllerRef.current
    if (!ctrl) return
    if (ctrl.isPlaying()) {
      ctrl.pause()
      setIsPlaying(false)
    } else {
      ctrl.play(speed)
      setIsPlaying(true)
    }
  }, [speed])

  const handleStepForward = useCallback(() => {
    controllerRef.current?.step()
  }, [])

  const handleStepBack = useCallback(() => {
    controllerRef.current?.stepBack()
  }, [])

  const handleJumpStart = useCallback(() => {
    controllerRef.current?.jumpTo(1)
  }, [])

  const handleJumpEnd = useCallback(() => {
    const ctrl = controllerRef.current
    if (!ctrl) return
    ctrl.jumpTo(ctrl.totalBars())
  }, [])

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10)
    controllerRef.current?.jumpTo(idx)
    setBarIndex(idx)
  }, [])

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    setShowSpeedMenu(false)
    const ctrl = controllerRef.current
    if (ctrl?.isPlaying()) {
      ctrl.pause()
      ctrl.play(newSpeed)
    }
  }, [])

  const handleTimeframeChange = useCallback((tvValue: TradingViewInterval) => {
    controllerRef.current?.pause()
    setIsPlaying(false)
    setInterval(tvValue)
    if (session?.symbol) {
      initDatafeed(session.symbol, tvValue, barsRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.symbol])

  // ── Trade + session handlers ──────────────────────────────────────────────
  const handleLogTrade = async () => {
    if (!session || !tradeForm.entry_price || !tradeForm.exit_price) return
    setSubmitting(true)
    try {
      await fetch(`/api/backtest/sessions/${id}/trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tradeForm,
          symbol: session.symbol,
          entry_price: parseFloat(tradeForm.entry_price),
          exit_price: parseFloat(tradeForm.exit_price),
          lot_size: parseFloat(tradeForm.lot_size),
          stop_loss: tradeForm.stop_loss ? parseFloat(tradeForm.stop_loss) : null,
          take_profit: tradeForm.take_profit ? parseFloat(tradeForm.take_profit) : null,
          entry_time: tradeForm.entry_time || null,
          exit_time: tradeForm.exit_time || null,
        }),
      })
      const res = await fetch(`/api/backtest/sessions/${id}`)
      const { session: updated } = await res.json()
      setSession(updated)
      setTradeModalOpen(false)
      setTradeForm({
        direction: "buy", entry_price: "", exit_price: "", lot_size: "0.1",
        stop_loss: "", take_profit: "", entry_time: "", exit_time: "", notes: "",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEndSession = async () => {
    setEndingSession(true)
    try {
      await fetch(`/api/backtest/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })
      router.push(`/dashboard/backtest/${id}`)
    } finally {
      setEndingSession(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const pnlDelta = session ? (session.final_balance - session.initial_balance) : 0
  const isProfit = pnlDelta >= 0
  const progress = totalBars > 1 ? Math.round((barIndex / totalBars) * 100) : 0

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
        <div className="flex max-w-lg flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-card p-8 text-center shadow-lg">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Unable to load market data</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{loadError}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/backtest/${id}`)}>Back to session</Button>
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">

        {/* ── Top header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-card border-b border-border/60 shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => { controllerRef.current?.pause(); router.push(`/dashboard/backtest/${id}`) }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to results</TooltipContent>
            </Tooltip>
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-foreground truncate max-w-[160px]">{session?.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 h-5 shrink-0">{session?.symbol}</Badge>
            </div>
          </div>

          {/* Live stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center hidden md:block">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Balance</p>
              <p className="font-bold text-foreground">${session?.final_balance?.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">P&L</p>
              <p className={cn("font-bold", isProfit ? "text-chart-1" : "text-chart-2")}>
                {isProfit ? "+" : ""}${Math.abs(pnlDelta).toFixed(2)}
              </p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Win Rate</p>
              <p className="font-bold text-foreground">{session?.win_rate_pct?.toFixed(1)}%</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Trades</p>
              <p className="font-bold text-foreground">{session?.total_trades}</p>
            </div>
          </div>

          {/* Timeframe + actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden lg:flex gap-0.5 bg-muted/40 rounded-md p-0.5">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.tvValue}
                  onClick={() => handleTimeframeChange(tf.tvValue)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded transition-colors font-medium",
                    interval === tf.tvValue
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            {session?.status === "running" && (
              <>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setTradeModalOpen(true)}>
                  <Plus className="w-3 h-3" /> Log Trade
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEndModalOpen(true)}>
                  End Session
                </Button>
              </>
            )}
            {session?.status !== "running" && (
              <Badge className="bg-chart-1/15 text-chart-1 border-0 text-xs gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {session?.status ?? "Completed"}
              </Badge>
            )}
          </div>
        </div>

        {/* ── Chart — fills all remaining space ─────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          <TradingViewChart
            key={chartKey}
            symbol={session?.symbol ?? "EURUSD"}
            interval={interval}
            theme="auto"
            height="100%"
            replayDatafeed={datafeedRef.current ?? undefined}
            onReady={(w) => { widgetRef.current = w }}
          />
        </div>

        {/* ── Replay controls ────────────────────────────────────────────── */}
        <div className="shrink-0 bg-card border-t border-border/60 px-4 py-2 flex items-center gap-3 z-20">

          {/* Current candle time */}
          <div className="hidden sm:flex flex-col min-w-[190px]">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Candle</span>
            <span className="text-xs font-mono text-foreground tabular-nums">{formatReplayTime(currentTime)}</span>
          </div>

          {/* Transport buttons */}
          <div className="flex items-center gap-0.5 mx-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleJumpStart}>
                  <ChevronFirst className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Jump to start</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStepBack}>
                  <SkipBack className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Step back one bar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="h-9 w-9 rounded-full mx-1"
                  onClick={handlePlayPause}
                >
                  {isPlaying
                    ? <Pause className="w-4 h-4" />
                    : <Play className="w-4 h-4 translate-x-[1px]" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStepForward}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Step forward one bar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleJumpEnd}>
                  <ChevronLast className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Jump to latest bar</TooltipContent>
            </Tooltip>
          </div>

          {/* Scrubber */}
          <div className="flex-1 flex items-center gap-2 max-w-md mx-auto">
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0 min-w-[32px] text-right">
              {barIndex}
            </span>
            <input
              type="range"
              min={1}
              max={totalBars}
              value={barIndex}
              onChange={handleScrub}
              className="flex-1 h-1.5 accent-primary cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0 min-w-[32px]">
              {totalBars}
            </span>
          </div>

          {/* Speed picker */}
          <div className="relative hidden sm:block">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 font-mono"
                  onClick={() => setShowSpeedMenu(v => !v)}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  {SPEEDS.find(s => s.value === speed)?.label ?? `${speed}x`}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Replay speed</TooltipContent>
            </Tooltip>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-1 bg-card border border-border rounded-md shadow-lg py-1 z-30 min-w-[80px]">
                {SPEEDS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleSpeedChange(s.value)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors",
                      speed === s.value && "text-primary font-bold"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress % */}
          <div className="hidden md:block min-w-[36px] text-right">
            <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>

      {/* ── Log Trade Modal ────────────────────────────────────────────────── */}
      <Dialog open={tradeModalOpen} onOpenChange={setTradeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Trade — {session?.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["buy", "sell"] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setTradeForm(f => ({ ...f, direction: dir }))}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all",
                      tradeForm.direction === dir
                        ? dir === "buy"
                          ? "border-chart-1 bg-chart-1/15 text-chart-1"
                          : "border-chart-2 bg-chart-2/15 text-chart-2"
                        : "border-border text-muted-foreground hover:border-border/80"
                    )}
                  >
                    {dir === "buy" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {dir.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Entry Price <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.00001" placeholder="1.08500"
                  value={tradeForm.entry_price}
                  onChange={e => setTradeForm(f => ({ ...f, entry_price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Exit Price <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.00001" placeholder="1.09200"
                  value={tradeForm.exit_price}
                  onChange={e => setTradeForm(f => ({ ...f, exit_price: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Lot Size</Label>
                <Input type="number" step="0.01" min="0.01" value={tradeForm.lot_size}
                  onChange={e => setTradeForm(f => ({ ...f, lot_size: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Stop Loss</Label>
                <Input type="number" step="0.00001" placeholder="optional" value={tradeForm.stop_loss}
                  onChange={e => setTradeForm(f => ({ ...f, stop_loss: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Take Profit</Label>
                <Input type="number" step="0.00001" placeholder="optional" value={tradeForm.take_profit}
                  onChange={e => setTradeForm(f => ({ ...f, take_profit: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Entry Time</Label>
                <Input type="datetime-local" value={tradeForm.entry_time}
                  onChange={e => setTradeForm(f => ({ ...f, entry_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Exit Time</Label>
                <Input type="datetime-local" value={tradeForm.exit_time}
                  onChange={e => setTradeForm(f => ({ ...f, exit_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Optional trade notes..." value={tradeForm.notes}
                onChange={e => setTradeForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTradeModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleLogTrade}
              disabled={submitting || !tradeForm.entry_price || !tradeForm.exit_price}
              className="gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Log Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── End Session Modal ──────────────────────────────────────────────── */}
      <Dialog open={endModalOpen} onOpenChange={setEndModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>End Backtest Session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will mark the session as completed. You can still review results but cannot log more trades.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndModalOpen(false)}>Keep Going</Button>
            <Button onClick={handleEndSession} disabled={endingSession} className="gap-2">
              {endingSession && <Loader2 className="w-4 h-4 animate-spin" />}
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── TradingView Attribution ────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground text-center py-2">
        Built with{' '}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          TradingView
        </a>
      </p>
    </TooltipProvider>
  )
}
