/**
 * Replay Datafeed for Backtest Chart
 *
 * Architecture:
 * - Pre-generates all bars once at creation time
 * - Internal cursor (cursorIdx) determines how many bars are "visible"
 * - getBars() only returns bars up to the cursor — so calling widget.chart().resetData()
 *   after any cursor change forces TradingView to re-request and render the correct slice
 * - subscribeBars() realtime callback is used ONLY for step-forward during play/step,
 *   avoiding a full chart reload for every single bar during playback
 * - stepBack() and jumpTo() set the cursor then call onNeedReset() so the chart page
 *   can call widget.chart().resetData() to redraw from scratch
 */

import { getSymbolMeta, generateMockBars, resolutionToSeconds, isValidBar } from './replay-utils'

export interface ReplayBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ReplayDatafeedOptions {
  symbol: string
  interval: string
  bars?: ReplayBar[]
  /** Called when cursor moves forward (play / step) — chart appends via realtime callback */
  onTick?: (currentTime: number, barIndex: number, totalBars: number) => void
  /** Called when cursor jumps backward or scrubs — chart must call resetData() */
  onNeedReset?: () => void
}

export interface ReplayController {
  play: (speedMultiplier?: number) => void
  pause: () => void
  step: () => void
  stepBack: () => void
  jumpTo: (barIndex: number) => void
  isPlaying: () => boolean
  currentIndex: () => number
  totalBars: () => number
  currentTime: () => number
}

export function createReplayDatafeed(options: ReplayDatafeedOptions): {
  datafeed: object
  controller: ReplayController
} {
  const { symbol, interval, bars: providedBars, onTick, onNeedReset } = options

  // Prefer server-backed normalized bars. Keep deterministic mock generation as
  // an explicit fallback so the chart remains usable when a provider request
  // fails, but never silently replace valid provider data.
  const now = Math.floor(Date.now() / 1000)
  const sixMonthsAgo = now - 60 * 60 * 24 * 180
  const allBars = providedBars?.length
    ? providedBars
    : generateMockBars(symbol, sixMonthsAgo, now, interval)
  console.log('[v0] Replay datafeed initialized', {
    providerBars: Boolean(providedBars?.length),
    count: allBars.length,
    firstTime: allBars[0]?.time ?? null,
    lastTime: allBars[allBars.length - 1]?.time ?? null,
  })
  const total = allBars.length
  console.log('[v0] Replay pipeline initialized', {
    symbol, interval, providerBars: Boolean(providedBars?.length), totalBars: total,
    firstTime: allBars[0]?.time ?? null, lastTime: allBars[allBars.length - 1]?.time ?? null,
  })

  // Start at 20% in so there's something to see immediately
  let cursorIdx = Math.max(1, Math.floor(total * 0.2))

  let playing = false
  let playTimer: ReturnType<typeof setInterval> | null = null

  // Realtime subscriber registered by subscribeBars
  let realtimeCallback: ((bar: any) => void) | null = null
  // Cache-invalidation callback registered by subscribeBars (5th argument)
  let resetCacheCallback: (() => void) | null = null

  // ── Internal helpers ──────────────────────────────────────────────────────

  function fireTick() {
    const bar = allBars[cursorIdx]
    if (!bar) return
    onTick?.(bar.time, cursorIdx, total - 1)
  }

  function pushRealtimeBar() {
    const bar = allBars[cursorIdx]
    if (bar && realtimeCallback && isValidBar(bar)) {
      realtimeCallback({ ...bar })
    }
    fireTick()
  }

  function stopTimer() {
    if (playTimer) {
      clearInterval(playTimer)
      playTimer = null
    }
    playing = false
  }

  // ── Controller ────────────────────────────────────────────────────────────

  function play(speedMultiplier = 1) {
    if (playing) return
    if (cursorIdx >= total - 1) return // already at end
    playing = true
    const ms = Math.max(50, Math.round(800 / speedMultiplier))
    playTimer = setInterval(() => {
      if (cursorIdx >= total - 1) {
        stopTimer()
        return
      }
      cursorIdx++
      pushRealtimeBar()
    }, ms)
  }

  function pause() {
    stopTimer()
  }

  function step() {
    pause()
    if (cursorIdx >= total - 1) return
    cursorIdx++
    pushRealtimeBar()
  }

  function stepBack() {
    pause()
    if (cursorIdx <= 1) return
    cursorIdx--
    fireTick()
    // Invalidate TV cache then tell page to call resetData()
    resetCacheCallback?.()
    onNeedReset?.()
  }

  function jumpTo(idx: number) {
    pause()
    const clamped = Math.min(Math.max(1, idx), total - 1)
    if (clamped === cursorIdx) return

    cursorIdx = clamped
    fireTick()

    // A scrub/jump can skip many bars. Sending only the destination bar through
    // subscribeBars leaves TradingView with holes in its internal logical-index
    // map; drawing tools then resolve a clicked coordinate to null. Rebuild the
    // historical slice for every jump, in both directions. Realtime updates are
    // reserved for contiguous play/step-forward ticks.
    resetCacheCallback?.()
    onNeedReset?.()
  }

  const controller: ReplayController = {
    play,
    pause,
    step,
    stepBack,
    jumpTo,
    isPlaying: () => playing,
    currentIndex: () => cursorIdx,
    totalBars: () => total - 1,
    currentTime: () => allBars[cursorIdx]?.time ?? 0,
  }

  // ── TradingView Datafeed ──────────────────────────────────────────────────

  const { pricescale } = getSymbolMeta(symbol)

  const datafeed = {
    onReady(callback: (config: any) => void) {
      setTimeout(() => callback({
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: false,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'],
      }), 0)
    },

    searchSymbols(_u: any, _e: any, _t: any, cb: (res: any[]) => void) {
      cb([])
    },

    resolveSymbol(symbolName: string, onResolved: (info: any) => void) {
      setTimeout(() => onResolved({
        name: symbolName,
        full_name: symbolName,
        description: symbolName,
        type: 'forex',
        session: '0000-2359:1234567',
        timezone: 'Etc/UTC',
        exchange: '',
        listed_exchange: '',
        format: 'price',
        minmov: 1,
        pricescale,
        minmove2: 0,
        fractional: false,
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: true,
        has_empty_bars: true,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'],
        intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
        volume_precision: 0,
        data_status: 'endofday',
      }), 0)
    },

    getBars(
      _symbolInfo: any,
      _resolution: string,
      periodParams: { from: number; to: number; countBack?: number },
      onHistory: (bars: any[], meta: { noData: boolean }) => void,
      onError?: (err: string) => void,
    ) {
      try {
        // Only expose bars up to the current cursor
        const slice = allBars.slice(0, cursorIdx + 1).filter(isValidBar)

        let filtered: typeof slice
        if (periodParams.countBack && periodParams.countBack > 0) {
          // countBack: return the last N bars up to `to`
          const endIdx = slice.filter(b => b.time <= periodParams.to)
          const count = Math.min(periodParams.countBack, endIdx.length)
          filtered = endIdx.slice(endIdx.length - count)
        } else {
          const effectiveTo = periodParams.from >= periodParams.to ? periodParams.to : periodParams.to
          const effectiveFrom = periodParams.from >= periodParams.to
            ? periodParams.to - 299 * resolutionToSeconds(_resolution)
            : periodParams.from
          filtered = slice.filter(b => b.time >= effectiveFrom && b.time <= effectiveTo)
        }

        // Always sort ascending — prevents "time order violation"
        filtered.sort((a, b) => a.time - b.time)
        console.log('[v0] Replay getBars callback', {
          symbol, resolution: _resolution, from: periodParams.from, to: periodParams.to,
          countBack: periodParams.countBack ?? null, cursorIdx, available: slice.length,
          returned: filtered.length, noData: filtered.length === 0,
          firstTime: filtered[0]?.time ?? null, lastTime: filtered[filtered.length - 1]?.time ?? null,
        })

        if (filtered.length === 0) {
          onHistory([], { noData: true })
        } else {
          onHistory(filtered, { noData: false })
        }
      } catch (e) {
        console.error('[v0] Replay getBars failed', { symbol, interval: _resolution, error: String(e) })
        onError?.(String(e))
      }
    },

    subscribeBars(
      _symbolInfo: any,
      _resolution: string,
      onRealtimeCallback: (bar: any) => void,
      _uid: string,
      onResetCacheNeededCallback?: () => void,
    ) {
      realtimeCallback = onRealtimeCallback
      // Store the reset callback so jumpTo/stepBack can invalidate the cache
      if (onResetCacheNeededCallback) {
        resetCacheCallback = onResetCacheNeededCallback
      }
    },

    unsubscribeBars(_uid: string) {
      realtimeCallback = null
      resetCacheCallback = null
    },
  }

  return { datafeed, controller }
}
