/**
 * TradingView Integration Utilities
 * 
 * Helper functions for working with the TradingView Charting Library
 * including symbol mapping, interval conversion, and data transformations
 */

export type TradingViewInterval = 
  | '1' | '5' | '15' | '30' | '60' | '120' | '240' | '360' | '480'
  | '1D' | '1W' | '1M'

interface SymbolConfig {
  base: string
  quote: string
  exchange?: string
  type?: 'forex' | 'stock' | 'crypto' | 'index'
}

/**
 * Convert standard symbol format to TradingView format
 * Examples:
 * - 'EUR/USD' -> 'EURUSD' (forex)
 * - 'AAPL' -> 'NASDAQ:AAPL' (stock)
 * - 'BTC/USD' -> 'CRYPTOCOMPARE:BTCUSD' (crypto)
 */
export function formatSymbolForTradingView(
  symbol: string,
  exchange?: string
): string {
  // Remove common delimiters
  const cleanSymbol = symbol.replace(/[\/\-\s]/g, '')

  // Add exchange prefix if provided
  if (exchange) {
    return `${exchange}:${cleanSymbol}`
  }

  // Auto-detect exchange for common symbols
  if (cleanSymbol.includes('USD') || cleanSymbol.includes('EUR')) {
    return cleanSymbol // Forex - no prefix needed for demo
  }

  return cleanSymbol
}

/**
 * Parse TradingView symbol back to components
 * Examples:
 * - 'EURUSD' -> { base: 'EUR', quote: 'USD', type: 'forex' }
 * - 'NASDAQ:AAPL' -> { base: 'AAPL', exchange: 'NASDAQ', type: 'stock' }
 */
export function parseSymbol(symbol: string): SymbolConfig {
  const parts = symbol.split(':')
  
  if (parts.length === 2) {
    // Exchange:Symbol format
    return {
      base: parts[1],
      quote: '',
      exchange: parts[0],
      type: inferSymbolType(parts[1]),
    }
  }

  // Direct symbol format (forex)
  const match = symbol.match(/^([A-Z]{3})([A-Z]{3})$/)
  if (match) {
    return {
      base: match[1],
      quote: match[2],
      type: 'forex',
    }
  }

  return {
    base: symbol,
    quote: '',
    type: inferSymbolType(symbol),
  }
}

/**
 * Infer symbol type from symbol string
 */
function inferSymbolType(
  symbol: string
): 'forex' | 'stock' | 'crypto' | 'index' {
  if (symbol.match(/^[A-Z]{3}[A-Z]{3}$/)) return 'forex'
  if (symbol.match(/^BTC|^ETH|COIN$/i)) return 'crypto'
  if (symbol.match(/^\^/)) return 'index'
  return 'stock'
}

/**
 * Convert application interval format to TradingView format
 * Examples:
 * - 1 (minute) -> '1'
 * - 5 (minutes) -> '5'
 * - 60 (minutes/1 hour) -> '60'
 * - 1440 (minutes/1 day) -> '1D'
 * - 10080 (minutes/1 week) -> '1W'
 * - 43200 (minutes/1 month) -> '1M'
 */
export function convertIntervalToTradingView(
  minutes: number
): TradingViewInterval {
  if (minutes < 60) return String(minutes) as TradingViewInterval
  if (minutes === 60) return '60'
  if (minutes === 120) return '120'
  if (minutes === 240) return '240'
  if (minutes === 360) return '360'
  if (minutes === 480) return '480'
  if (minutes === 1440) return '1D'
  if (minutes === 10080) return '1W'
  if (minutes >= 43200) return '1M'
  
  return '60' // Default to 1 hour
}

/**
 * Convert TradingView interval back to minutes
 */
export function convertIntervalToMinutes(interval: TradingViewInterval): number {
  const timeFrames: Record<string, number> = {
    '1': 1,
    '5': 5,
    '15': 15,
    '30': 30,
    '60': 60,
    '120': 120,
    '240': 240,
    '360': 360,
    '480': 480,
    '1D': 1440,
    '1W': 10080,
    '1M': 43200,
  }
  
  return timeFrames[interval] || 60
}

/**
 * Get recommended TradingView interval for a trade duration
 */
export function getRecommendedInterval(
  entryTime: Date,
  exitTime: Date
): TradingViewInterval {
  const durationMinutes =
    (exitTime.getTime() - entryTime.getTime()) / 1000 / 60

  if (durationMinutes <= 5) return '1'
  if (durationMinutes <= 15) return '5'
  if (durationMinutes <= 60) return '15'
  if (durationMinutes <= 240) return '60'
  if (durationMinutes <= 1440) return '240'
  if (durationMinutes <= 10080) return '1D'
  
  return '1W'
}

/**
 * Generate TradingView chart URL for embedding
 * (Only for reference, actual usage is through component)
 */
export function generateChartUrl(
  symbol: string,
  interval: TradingViewInterval = '60'
): string {
  const params = new URLSearchParams({
    symbol: formatSymbolForTradingView(symbol),
    interval,
    theme: 'dark',
  })
  
  return `/charts?${params.toString()}`
}

/**
 * Validate symbol format
 */
export function isValidSymbol(symbol: string): boolean {
  const cleanSymbol = symbol.replace(/[\/\-\s]/g, '')
  
  // Check if it's a valid forex pair (3+3 letters)
  if (cleanSymbol.match(/^[A-Z]{3}[A-Z]{3}$/)) return true
  
  // Check if it's a valid stock symbol (up to 5 characters)
  if (cleanSymbol.match(/^[A-Z]{1,5}$/)) return true
  
  // Check if it has exchange prefix
  if (symbol.includes(':')) return true
  
  return false
}

/**
 * Market hours for different exchanges
 */
export const MARKET_HOURS: Record<string, { open: string; close: string; tz: string }> = {
  'NYSE': { open: '09:30', close: '16:00', tz: 'America/New_York' },
  'NASDAQ': { open: '09:30', close: '16:00', tz: 'America/New_York' },
  'FOREX': { open: '00:00', close: '23:59', tz: 'UTC' },
  'LSE': { open: '08:00', close: '16:30', tz: 'Europe/London' },
  'JPX': { open: '09:00', close: '15:00', tz: 'Asia/Tokyo' },
}
