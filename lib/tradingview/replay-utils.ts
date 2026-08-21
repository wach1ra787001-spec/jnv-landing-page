/**
 * Shared bar-generation helpers used by both mock-datafeed and replay-datafeed.
 *
 * Key invariants that MUST hold for every bar, or TradingView's cursor math
 * throws "Value is null" in a RAF loop when drawing tools are used:
 *
 *   1. high > low  (strict — not >=)
 *   2. high >= open AND high >= close
 *   3. low  <= open AND low  <= close
 *   4. All OHLC values are finite positive numbers
 *   5. The number of decimal places matches the pricescale used in resolveSymbol
 *   6. Wicks survive parseFloat(toFixed(decimals)) rounding without collapsing
 */

export interface SymbolDefinition extends SymbolMeta {
  symbol: string
  displayName: string
  exchange: string
  listedExchange: string
  assetClass: 'forex' | 'futures' | 'crypto' | 'index' | 'commodity'
  provider: string
  providerDataset: string
  providerSymbol: string
  providerSymbolType: string
  supportedResolutions: string[]
}

export interface SymbolMeta {
  pricescale: number
  basePrice: number
  spread: number
}

const SUPPORTED_RESOLUTIONS = ['1', '5', '15', '30', '60', '240', '1D', '1W']

const SYMBOL_DEFINITIONS: Record<string, SymbolDefinition> = {
  EURUSD: { symbol: 'EURUSD', displayName: 'EUR/USD (CME 6E futures)', exchange: 'CME', listedExchange: 'CME', assetClass: 'forex', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: '6E.c.0', providerSymbolType: 'continuous', pricescale: 100000, basePrice: 1.1, spread: 0.002, supportedResolutions: SUPPORTED_RESOLUTIONS },
  GBPUSD: { symbol: 'GBPUSD', displayName: 'GBP/USD (CME 6B futures)', exchange: 'CME', listedExchange: 'CME', assetClass: 'forex', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: '6B.c.0', providerSymbolType: 'continuous', pricescale: 100000, basePrice: 1.25, spread: 0.002, supportedResolutions: SUPPORTED_RESOLUTIONS },
  USDJPY: { symbol: 'USDJPY', displayName: 'USD/JPY (CME 6J futures)', exchange: 'CME', listedExchange: 'CME', assetClass: 'forex', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: '6J.c.0', providerSymbolType: 'continuous', pricescale: 1000, basePrice: 150, spread: 0.05, supportedResolutions: SUPPORTED_RESOLUTIONS },
  XAUUSD: { symbol: 'XAUUSD', displayName: 'Gold / USD (COMEX GC futures)', exchange: 'COMEX', listedExchange: 'COMEX', assetClass: 'commodity', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: 'GC.c.0', providerSymbolType: 'continuous', pricescale: 100, basePrice: 2300, spread: 2, supportedResolutions: SUPPORTED_RESOLUTIONS },
  US500: { symbol: 'US500', displayName: 'S&P 500 (CME ES futures)', exchange: 'CME', listedExchange: 'CME', assetClass: 'index', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: 'ES.c.0', providerSymbolType: 'continuous', pricescale: 100, basePrice: 5000, spread: 20, supportedResolutions: SUPPORTED_RESOLUTIONS },
  US100: { symbol: 'US100', displayName: 'Nasdaq 100 (CME NQ futures)', exchange: 'CME', listedExchange: 'CME', assetClass: 'index', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: 'NQ.c.0', providerSymbolType: 'continuous', pricescale: 100, basePrice: 18000, spread: 20, supportedResolutions: SUPPORTED_RESOLUTIONS },
  US30: { symbol: 'US30', displayName: 'Dow Jones (CBOT YM futures)', exchange: 'CBOT', listedExchange: 'CBOT', assetClass: 'index', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: 'YM.c.0', providerSymbolType: 'continuous', pricescale: 100, basePrice: 40000, spread: 20, supportedResolutions: SUPPORTED_RESOLUTIONS },
  BTCUSD: { symbol: 'BTCUSD', displayName: 'Bitcoin / USD (CME BTC futures)', exchange: 'CME', listedExchange: 'CME', assetClass: 'crypto', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: 'BTC.c.0', providerSymbolType: 'continuous', pricescale: 100, basePrice: 65000, spread: 100, supportedResolutions: SUPPORTED_RESOLUTIONS },
}

export function getSymbolDefinition(symbolName: string): SymbolDefinition {
  const normalized = symbolName.replace(/[\\/\\-\\s]/g, '').toUpperCase()
  return SYMBOL_DEFINITIONS[normalized] ?? {
    symbol: normalized, displayName: normalized, exchange: 'JnV', listedExchange: 'JnV', assetClass: 'forex', provider: 'Databento', providerDataset: 'GLBX.MDP3', providerSymbol: normalized, providerSymbolType: 'raw_symbol', pricescale: 100000, basePrice: 1.1, spread: 0.002, supportedResolutions: SUPPORTED_RESOLUTIONS,
  }
}

export function getSymbolMeta(symbolName: string): SymbolMeta {
  const upper = symbolName.toUpperCase()
  if (/US\d{2,3}|SPX|NDX|NAS|DAX|DE\d{2}|UK\d{2}|JP\d{3}/.test(upper))
    return { pricescale: 100,   basePrice: 18000, spread: 20    }
  if (/XAU|GOLD/.test(upper))  return { pricescale: 100,   basePrice: 2300,  spread: 2     }
  if (/XAG|SILVER/.test(upper)) return { pricescale: 1000,  basePrice: 28,    spread: 0.05  }
  if (/BTC/.test(upper))        return { pricescale: 100,   basePrice: 65000, spread: 100   }
  if (/ETH/.test(upper))        return { pricescale: 100,   basePrice: 3500,  spread: 5     }
  if (/OIL|WTI|BRENT/.test(upper)) return { pricescale: 100, basePrice: 80,  spread: 0.5   }
  if (/JPY/.test(upper))        return { pricescale: 1000,  basePrice: 150,   spread: 0.05  }
  // Generic forex — 5 decimal places
  return { pricescale: 100000, basePrice: 1.10000, spread: 0.002 }
}

export function resolutionToSeconds(resolution: string): number {
  if (resolution === '1D') return 86400
  if (resolution === '1W') return 86400 * 7
  if (resolution === '1M') return 86400 * 30
  return parseInt(resolution, 10) * 60
}

/**
 * Validate a single bar. TradingView's internal cursor coordinate math will
 * throw "Value is null" if any of these invariants are violated.
 */
export function isValidBar(b: any): boolean {
  if (b == null) return false
  if (typeof b.time !== 'number' || !isFinite(b.time) || b.time <= 0) return false
  const { open, high, low, close } = b
  if ([open, high, low, close].some(v => typeof v !== 'number' || !isFinite(v) || v <= 0)) return false
  if (high <= low)  return false   // degenerate — no price range
  if (high < open)  return false
  if (high < close) return false
  if (low  > open)  return false
  if (low  > close) return false
  return true
}

export function normalizeExternalBars(rawBars: any[]) {
  const mapped = rawBars
    .map((bar) => {
      const rawTime = Number(bar.time ?? bar.timestamp ?? bar.ts_event)
      const time = rawTime > 1e17 ? Math.floor(rawTime / 1e9) : rawTime > 1e14 ? Math.floor(rawTime / 1e6) : rawTime > 1e11 ? Math.floor(rawTime / 1e3) : Math.floor(rawTime)
      return {
      time,
      open: Number(bar.open),
      high: Number(bar.high),
      low: Number(bar.low),
      close: Number(bar.close),
      volume: Number(bar.volume ?? 0),
      }
    })
  const sorted = mapped.filter(isValidBar).sort((a, b) => a.time - b.time)

  const bars = sorted.filter((bar, index) => index === 0 || bar.time !== sorted[index - 1].time)
  console.log('[v0] OHLC pipeline normalized', {
    inputCount: rawBars.length,
    mappedCount: mapped.length,
    validCount: sorted.length,
    rejectedCount: mapped.length - sorted.length,
    duplicateCount: sorted.length - bars.length,
    outputCount: bars.length,
    firstTime: bars[0]?.time ?? null,
    lastTime: bars[bars.length - 1]?.time ?? null,
  })
  return bars
}

export function generateMockBars(
  symbolName: string,
  from: number,
  to: number,
  resolution: string,
  countBack?: number,
): { time: number; open: number; high: number; low: number; close: number; volume: number }[] {
  const step      = resolutionToSeconds(resolution)
  const { basePrice, spread, pricescale } = getSymbolMeta(symbolName)
  const decimals  = Math.round(Math.log10(pricescale))

  // Align `to` down to nearest bar boundary
  const alignedTo = Math.floor(to / step) * step

  // When countBack is provided, derive `from` from it — this is the correct
  // way TradingView requests initial data and scroll-left data.
  // When from > to (malformed request), also fall back to countBack-based from.
  let alignedFrom: number
  if (countBack && countBack > 0) {
    alignedFrom = alignedTo - (countBack - 1) * step
  } else if (from >= to) {
    // Fallback: generate 300 bars ending at `to`
    alignedFrom = alignedTo - 299 * step
  } else {
    alignedFrom = Math.ceil(from / step) * step
  }

  // Deterministic seeded PRNG (LCG) — seed per timestamp so overlapping
  // requests always generate the SAME bar for the same timestamp.
  // Otherwise TradingView throws "time order violation" when the same timestamp
  // produces different bars in different API calls.
  const createRandForBar = (t: number): (() => number) => {
    let seed = symbolName.split('').reduce((a, c) => a + c.charCodeAt(0), 1)
    // Fold the timestamp into the seed
    seed = (seed * 31 + (t % 1000000)) | 0
    return () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff
      return seed / 0x7fffffff
    }
  }

  // Minimum safe wick: enough ticks to survive toFixed(decimals) rounding.
  // We use 5 ticks so that even after rounding, high > bodyHigh and low < bodyLow
  // remain strict inequalities at any pricescale.
  const minWick = 5 / pricescale

  const bars: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = []

  for (let t = alignedFrom; t <= alignedTo; t += step) {
    // Fresh PRNG seeded ONLY by this timestamp — ensures same bar for same (symbol, t) pair
    // regardless of what other ranges were requested. This eliminates "time order violation".
    const rand = createRandForBar(t)

    // Generate open/close as deviations from basePrice, using only this bar's PRNG.
    // Do NOT carry price between bars — each bar is independent.
    const rawOpen  = basePrice + (rand() - 0.5) * spread
    const rawClose = basePrice + (rand() - 0.5) * spread

    // Snap to correct decimal precision
    const open  = parseFloat(rawOpen.toFixed(decimals))
    const close = parseFloat(rawClose.toFixed(decimals))

    // Body boundaries (before wick)
    const bodyHigh = Math.max(open, close)
    const bodyLow  = Math.min(open, close)

    // Wicks: at least minWick, up to 40% of spread extra
    const wickUp   = minWick + rand() * spread * 0.4
    const wickDown = minWick + rand() * spread * 0.4

    // Round wicks — add one more tick after rounding to guarantee strict inequality
    const high = parseFloat((bodyHigh + wickUp).toFixed(decimals)) + (1 / pricescale)
    const low  = parseFloat((bodyLow  - wickDown).toFixed(decimals)) - (1 / pricescale)

    // Final precision snap
    const highF = parseFloat(high.toFixed(decimals))
    const lowF  = parseFloat(low.toFixed(decimals))

    // Hard invariant check — drop any bar that still violates constraints
    if (
      highF <= lowF ||
      highF < open  || highF < close ||
      lowF  > open  || lowF  > close ||
      open <= 0 || close <= 0
    ) {
      continue
    }

    bars.push({
      time:   t,
      open,
      high:   highF,
      low:    lowF,
      close,
      volume: Math.max(1, Math.floor(rand() * 1000) + 100),
    })
  }

  // Always sort ascending — TradingView throws "time order violation" if bars
  // arrive out of order, even within a single getBars response.
  bars.sort((a, b) => a.time - b.time)

  return bars
}
