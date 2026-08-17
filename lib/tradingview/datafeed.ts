/**
 * TradingView Charting Library - MT5 Datafeed Integration
 * 
 * This file implements the UDF (Universal Data Feed) interface required by TradingView.
 * Connects to MT5 bridge via Next.js API routes to fetch OHLC data.
 * 
 * Architecture:
 * TradingView Chart → UDF Datafeed → /api/mt5/ohlc → MT5 Bridge → Broker
 */

interface DatafeedConfig {
  url: string
  timeout: number
}

interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// MT5 OHLC API endpoint
const MT5_OHLC_URL = '/api/mt5/ohlc'

const datafeedConfig: DatafeedConfig = {
  url: MT5_OHLC_URL,
  timeout: 10000,
}

// Tracks active real-time pollers so we can actually stop them on unsubscribe,
// and so stale pollers can't write into a series that's moved on to a
// different symbol/resolution.
interface ActiveSubscription {
  intervalId: ReturnType<typeof setInterval>
  symbol: string
  resolution: string
  lastBarTime: number
}
const activeSubscriptions = new Map<string, ActiveSubscription>()

/**
 * A bar is only usable if every OHLC field is a finite number.
 * A single NaN/null field here is enough to corrupt the price scale's
 * price<->pixel mapping, which is what the crosshair/drawing tools rely on
 * to place and move their anchor points.
 */
function isValidBar(bar: any): boolean {
  const time = Number(bar.time)
  const open = parseFloat(bar.open)
  const high = parseFloat(bar.high)
  const low = parseFloat(bar.low)
  const close = parseFloat(bar.close)

  return (
    Number.isFinite(time) &&
    Number.isFinite(open) &&
    Number.isFinite(high) &&
    Number.isFinite(low) &&
    Number.isFinite(close)
  )
}

function normalizeBar(bar: any): Bar {
  return {
    time: Math.floor(Number(bar.time) * 1000),
    open: parseFloat(bar.open),
    high: parseFloat(bar.high),
    low: parseFloat(bar.low),
    close: parseFloat(bar.close),
    volume: Number.isFinite(parseInt(bar.volume)) ? parseInt(bar.volume) : 0,
  }
}

/**
 * Filters out malformed bars, de-dupes by timestamp (keeping the last one
 * seen for a given time, since that's usually the most complete/updated),
 * and guarantees ascending order. The charting library assumes a clean,
 * strictly ascending, gap-consistent array — anything else destabilizes its
 * internal bar-index cache, which the drawing engine also reads from.
 */
function cleanBars(rawBars: any[]): Bar[] {
  const byTime = new Map<number, Bar>()

  for (const raw of rawBars) {
    if (!isValidBar(raw)) continue
    const bar = normalizeBar(raw)
    byTime.set(bar.time, bar)
  }

  return Array.from(byTime.values()).sort((a, b) => a.time - b.time)
}

/**
 * Creates a UDF-compliant datafeed object for TradingView
 * Handles symbol resolution, bar data, and configuration
 */
export function createDatafeed() {
  return {
    onReady: (callback: any) => {
      console.log('[TradingView] Datafeed ready')
      callback({
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
        supported_resolutions: [
          '1', '5', '15', '30', '60', '120', '240', '360', '480',
          '1D', '1W', '1M'
        ],
        exchanges: [
          { value: '', name: 'All Exchanges', desc: '' },
          { value: 'FOREX', name: 'Forex', desc: 'Forex' },
          { value: 'CRYPTO', name: 'Crypto', desc: 'Cryptocurrency' },
          { value: 'NASDAQ', name: 'NASDAQ', desc: 'NASDAQ' },
          { value: 'NYSE', name: 'NYSE', desc: 'NYSE' },
        ],
        symbols_types: [
          { name: 'All types', value: '' },
          { name: 'Stock', value: 'stock' },
          { name: 'Index', value: 'index' },
          { name: 'Forex', value: 'forex' },
          { name: 'Crypto', value: 'crypto' },
        ],
      })
    },

    searchSymbols: (
      userInput: string,
      exchange: string,
      symbolType: string,
      onResultReadyCallback: any
    ) => {
      console.log('[TradingView] Search symbols:', userInput)
      // TODO: Replace with production symbol search
      onResultReadyCallback([])
    },

    resolveSymbol: (
      symbolName: string,
      onSymbolResolvedCallback: any,
      onResolveErrorCallback: any
    ) => {
      console.log('[TradingView] Resolve symbol:', symbolName)

      const parts = symbolName.split(':')
      const symbol = parts[parts.length - 1]

      if (!symbol) {
        onResolveErrorCallback('Cannot resolve empty symbol')
        return
      }

      // TODO: Replace with production symbol resolution
      // Add real symbol metadata from your data provider
      const symbolInfo: any = {
        name: symbol,
        description: symbol,
        type: 'forex',
        session: '24x5',
        timezone: 'Etc/UTC',
        minmov: 1,
        pricescale: 100000,
        has_daily: true,
        has_intraday: true,
        has_weekly_and_monthly: true,
        supported_resolutions: [
          '1', '5', '15', '30', '60', '120', '240', '360', '480',
          '1D', '1W', '1M'
        ],
        volume_precision: 0,
        data_status: 'streaming',
      }

      onSymbolResolvedCallback(symbolInfo)
    },

    getBars: async (
      symbolInfo: any,
      resolution: string,
      periodParams: any,
      onHistoryCallback: any,
      onErrorCallback: any
    ) => {
      try {
        const { firstDataRequest, from, to } = periodParams

        const response = await fetch(
          `${datafeedConfig.url}?symbol=${symbolInfo.name}&interval=${resolution}&from=${from}&to=${to}`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!data.bars || data.bars.length === 0) {
          onHistoryCallback([], { noData: true })
          return
        }

        const bars = cleanBars(data.bars)

        if (bars.length === 0) {
          // Every bar in the response was malformed — treat as no data
          // rather than handing the library a broken array.
          console.warn('[TradingView] All bars in response were invalid, discarding')
          onHistoryCallback([], { noData: true })
          return
        }

        onHistoryCallback(bars, { noData: bars.length === 0 && !firstDataRequest })
      } catch (error) {
        console.error('[TradingView] Error fetching bars:', error)
        onErrorCallback(error instanceof Error ? error.message : 'Failed to fetch bars')
      }
    },

    subscribeBars: (
      symbolInfo: any,
      resolution: string,
      onRealtimeCallback: any,
      subscriptionUID: string,
      onResetCacheCallback: any
    ) => {
      console.log('[TradingView] Subscribe bars:', symbolInfo.name, resolution)

      // Defensive: if this UID was already subscribed (shouldn't normally
      // happen, but guards against double-invocation), clear the old poller
      // first so we never have two intervals writing into the same series.
      const existing = activeSubscriptions.get(subscriptionUID)
      if (existing) {
        clearInterval(existing.intervalId)
        activeSubscriptions.delete(subscriptionUID)
      }

      const state: ActiveSubscription = {
        symbol: symbolInfo.name,
        resolution,
        lastBarTime: 0,
        intervalId: setInterval(async () => {
          try {
            const now = Math.floor(Date.now() / 1000)
            const response = await fetch(
              `${datafeedConfig.url}?symbol=${symbolInfo.name}&interval=${resolution}&from=${now - 3600}&to=${now}`
            )

            if (!response.ok) return

            const data = await response.json()
            if (!data.bars || data.bars.length === 0) return

            const bars = cleanBars(data.bars)
            if (bars.length === 0) return

            const latestBar = bars[bars.length - 1]

            // Guard against out-of-order/duplicate updates. Feeding the
            // library a bar with a time <= the last one it already has can
            // corrupt its internal bar-index cache, which the drawing/
            // crosshair engine also relies on.
            const current = activeSubscriptions.get(subscriptionUID)
            if (!current) return // unsubscribed while this fetch was in flight
            if (latestBar.time < current.lastBarTime) return

            current.lastBarTime = latestBar.time
            onRealtimeCallback(latestBar)
          } catch (error) {
            console.error('[TradingView] Realtime update error:', error)
          }
        }, 5000),
      }

      activeSubscriptions.set(subscriptionUID, state)
    },

    unsubscribeBars: (subscriptionUID: string) => {
      console.log('[TradingView] Unsubscribe bars:', subscriptionUID)

      const sub = activeSubscriptions.get(subscriptionUID)
      if (sub) {
        clearInterval(sub.intervalId)
        activeSubscriptions.delete(subscriptionUID)
      }
    },
  }
}

export { datafeedConfig }