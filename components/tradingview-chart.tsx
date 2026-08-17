'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { createMockDatafeed } from '@/lib/tradingview/mock-datafeed'
import { cn } from '@/lib/utils'

function createSingleBarDatafeed(symbolName: string, bar: SingleBarData) {
  const upper = symbolName.toUpperCase()
  const pricescale = /US\d{2,3}|SPX|NDX|NAS|DAX|DE\d{2}|XAU|GOLD|BTC|ETH/.test(upper)
    ? 100
    : 100000

  // Build a window of 15 daily context bars (7 before + trade bar + 7 after).
  // TradingView needs a non-trivial price range to initialise its Y-axis and
  // drawing-tool coordinate math — a single isolated bar causes null cursors.
  const DAY = 86400
  const decimals = Math.round(Math.log10(pricescale))
  const round = (n: number) => parseFloat(n.toFixed(decimals))
  // Align trade bar to midnight UTC so padding bars are evenly spaced
  const tradeDay = Math.floor(bar.time / DAY) * DAY
  const midPrice = (bar.open + bar.close) / 2
  // Spread for padding bars: 0.5% of midPrice gives a visible but tidy range
  const spread = midPrice * 0.005

  // NOTE: every bar MUST include a numeric `volume`. TradingView creates a
  // default volume study that reads bar.volume — a missing/undefined value
  // makes the volume pane's paint call setCurrentPosition() and throw
  // "Value is null" when drawing or moving the cursor.
  type Bar = SingleBarData & { volume: number }
  const allBars: Bar[] = []
  for (let i = -7; i <= 7; i++) {
    const t = tradeDay + i * DAY
    if (i === 0) {
      // The actual trade bar — use real OHLC values
      allBars.push({
        time:  tradeDay,
        open:  round(bar.open),
        high:  round(bar.high),
        low:   round(bar.low),
        close: round(bar.close),
        volume: 1000,
      })
    } else {
      // Ghost bars at midPrice with a small spread so the Y-axis has range
      const p = midPrice + (Math.sin(i) * spread * 0.3) // slight wave for visual interest
      allBars.push({
        time:  t,
        open:  round(p),
        high:  round(p + spread * 0.4),
        low:   round(p - spread * 0.4),
        close: round(p),
        volume: 500,
      })
    }
  }
  allBars.sort((a, b) => a.time - b.time)

  return {
    onReady: (cb: (config: object) => void) => {
      setTimeout(() => cb({ supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'] }), 0)
    },
    resolveSymbol: (_: string, onResolve: (info: object) => void) => {
      setTimeout(() => onResolve({
        name: symbolName,
        ticker: symbolName,
        description: symbolName,
        type: 'forex',
        session: '0000-2359:1234567',
        timezone: 'UTC',
        exchange: '',
        minmov: 1,
        pricescale,
        has_intraday: true,
        has_daily: true,
        has_empty_bars: true,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'],
        data_status: 'endofday',
      }), 0)
    },
    getBars: (
      _si: any,
      _res: string,
      periodParams: { from: number; to: number; countBack?: number },
      onHistory: (bars: any[], meta: { noData: boolean }) => void,
    ) => {
      let result: SingleBarData[]
      if (periodParams.countBack && periodParams.countBack > 0) {
        // countBack request — return up to countBack bars ending at `to`
        const eligible = allBars.filter(b => b.time <= periodParams.to)
        result = eligible.slice(Math.max(0, eligible.length - periodParams.countBack))
      } else {
        result = allBars.filter(b => b.time >= periodParams.from && b.time <= periodParams.to)
      }
      result.length > 0
        ? onHistory(result, { noData: false })
        : onHistory([], { noData: true })
    },
    subscribeBars: () => {},
    unsubscribeBars: () => {},
    searchSymbols: () => {},
  }
}

export interface SingleBarData {
  time: number   // Unix seconds
  open: number
  high: number
  low: number
  close: number
}

interface TradingViewChartProps {
  symbol?: string
  interval?: string
  theme?: 'light' | 'dark' | 'auto'
  height?: number | string
  /** When set, the chart shows only this one candle — no mock data generated */
  singleBar?: SingleBarData
  /** Pass a pre-created replay datafeed instance to use instead of the default mock */
  replayDatafeed?: object
  /** Called once the widget is fully ready — receives the widget instance */
  onReady?: (widget: any) => void
}

// ---------------------------------------------------------------------------
// Singleton script loader.
//
// Previously, every mount/re-init of this component (e.g. on symbol or
// interval change, which happens on nearly every user interaction) checked
// `window.TradingView` and, if absent, appended a brand new <script> tag.
// If the user changed symbol/interval again before the first script tag
// finished loading, a SECOND tag would be appended. Both `onload` handlers
// eventually fire and each calls renderChart(), so two TradingView.widget()
// instances could get created against the same container before the first
// one's cleanup (widget.remove()) had run. Two widgets sharing one canvas
// fight over crosshair/mouse tracking, which is a real-world cause of
// intermittent "Value is null" errors during cursor-position paint when
// drawing — distinct from (and in addition to) any bar-data issue.
//
// Fix: load the script exactly once, and let every caller await the same
// promise instead of racing to create their own <script> tag.
// ---------------------------------------------------------------------------
let chartingLibraryPromise: Promise<void> | null = null

function loadChartingLibrary(): Promise<void> {
  if ((window as any).TradingView) {
    return Promise.resolve()
  }
  if (chartingLibraryPromise) {
    return chartingLibraryPromise
  }
  chartingLibraryPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/charting_library/charting_library.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = (error) => {
      // Allow a future mount to retry rather than being stuck with a
      // permanently-rejected singleton.
      chartingLibraryPromise = null
      reject(error)
    }
    document.body.appendChild(script)
  })
  return chartingLibraryPromise
}

export function TradingViewChart({
  symbol = 'EURUSD',
  interval = '60',
  theme = 'auto',
  height = 500,
  singleBar,
  replayDatafeed,
  onReady,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { theme: currentTheme } = useTheme()
  const widgetRef = useRef<any>(null)
  // Store theme in a ref so it never triggers chart re-initialization
  const themeRef = useRef(currentTheme)
  useEffect(() => { themeRef.current = currentTheme }, [currentTheme])


  // Phase 1: Mount component and render container
  useEffect(() => {
    setMounted(true)
  }, [])

  // Phase 2: Initialize chart after container is mounted
  useEffect(() => {
    if (!mounted || !containerRef.current) {
      return
    }

    // Guards against this exact effect instance acting after it has been
    // superseded by a newer run (e.g. symbol/interval changed again while
    // the script was still loading, or the component unmounted).
    let cancelled = false
    let sizeObserver: ResizeObserver | null = null

    /**
     * Resolves once containerRef has a non-zero width AND height.
     *
     * Why this matters: `autosize: true` corrects the widget's *visual*
     * size after the fact via its own internal ResizeObserver, but if the
     * widget is constructed while the container measures 0 (very common on
     * first paint with flex/calc-based layouts, before the browser has
     * finished layout for this frame), the price scale's internal
     * coordinate<->value transform can be computed against that zero-size
     * canvas and never fully recover — leaving `coordinateToValue` (and
     * therefore setCurrentPosition) returning/throwing null on every
     * subsequent mouse move, not just once. Waiting for a real size before
     * ever calling `new TradingView.widget()` avoids that bad initial
     * measurement entirely.
     */
    const waitForNonZeroSize = (el: HTMLElement): Promise<void> => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        return Promise.resolve()
      }
      return new Promise((resolve) => {
        sizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0) {
              sizeObserver?.disconnect()
              sizeObserver = null
              resolve()
              return
            }
          }
        })
        sizeObserver.observe(el)
      })
    }

    const renderChart = () => {
      if (cancelled) return

      try {
        if (!containerRef.current) {
          console.error('[v0] Container ref missing during render')
          setIsLoading(false)
          return
        }

        const TradingView = (window as any).TradingView
        if (!TradingView) {
          setIsLoading(false)
          return
        }

        // If a previous widget from a stale effect is somehow still around
        // (shouldn't happen given the cancelled guard, but cheap insurance
        // against double-instantiation), tear it down first.
        if (widgetRef.current) {
          try {
            widgetRef.current.remove()
          } catch (_) {}
          widgetRef.current = null
        }

        const chartTheme = theme === 'auto' ? themeRef.current || 'dark' : theme

        const widget = new TradingView.widget({
          library_path: '/charting_library/',
          autosize: true,
          symbol,
          interval,
          timezone: 'UTC',
          theme: chartTheme,
          locale: 'en',
          enable_publishing: false,
          allow_symbol_change: true,
          container: containerRef.current,
          datafeed: replayDatafeed ?? (singleBar ? createSingleBarDatafeed(symbol, singleBar) : createMockDatafeed()),
          client_id: 'jnv-trading-journal',
          user_id: 'jnv-user-minimal',
          // Guards against a degenerate (zero-height) price scale, which is
          // another way coordinateToValue can end up returning null on
          // mouse move. Reserves a fixed margin above/below the price range
          // so the scale can never collapse to a single value.
          overrides: {
            'mainSeriesProperties.priceAxisProperties.autoScale': true,
            'scalesProperties.scaleSeriesOnly': false,
          },
          disabled_features: ['volume_force_overlay'],
        })

        widgetRef.current = widget

        widget.onChartReady(() => {
          if (cancelled) {
            // A newer effect superseded this one while the widget was
            // initializing — tear this one down instead of surfacing it.
            try {
              widget.remove()
            } catch (_) {}
            if (widgetRef.current === widget) widgetRef.current = null
            return
          }
          setIsLoading(false)
          onReady?.(widget)
        })

        // Fallback: clear loading state after 5s regardless
        setTimeout(() => { if (!cancelled) setIsLoading(false) }, 5000)
      } catch (error) {
        if (!cancelled) setIsLoading(false)
      }
    }

    Promise.all([
      loadChartingLibrary(),
      waitForNonZeroSize(containerRef.current),
    ])
      .then(() => {
        if (!cancelled) renderChart()
      })
      .catch((error) => {
        console.error('[v0] Failed to load library:', error)
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      sizeObserver?.disconnect()
      sizeObserver = null
      if (widgetRef.current) {
        try {
          widgetRef.current.remove()
          widgetRef.current = null
        } catch (_) {}
      }
    }
  // Re-init when symbol, interval, or replay datafeed instance changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, symbol, interval, replayDatafeed, singleBar])

  if (!mounted) {
    return (
      <div className="w-full bg-background text-foreground flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height
  const isFullscreen = height === '100%'

  return (
    <div
      className={cn(
        "relative w-full bg-background overflow-hidden",
        !isFullscreen && "rounded-lg border border-border"
      )}
      style={{ height: resolvedHeight }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="text-sm text-muted-foreground">Initializing chart...</div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}