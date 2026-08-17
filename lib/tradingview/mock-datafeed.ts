/**
 * Mock TradingView Datafeed — Historical data only, no streaming.
 *
 * All timestamps are in SECONDS (Unix epoch) as required by TradingView.
 * Bars returned from getBars must have time values strictly within [from, to].
 */

import { getSymbolMeta, generateMockBars } from './replay-utils'


export function createMockDatafeed() {
  return {
    onReady: (callback: any) => {
      setTimeout(() => callback({
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: false,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
      }), 0)
    },

    searchSymbols: (
      _userInput: string,
      _exchange: string,
      _symbolType: string,
      onResultReadyCallback: any
    ) => {
      onResultReadyCallback([])
    },

    resolveSymbol: (
      symbolName: string,
      onSymbolResolvedCallback: any,
      _onResolveErrorCallback: any
    ) => {
      const { pricescale } = getSymbolMeta(symbolName)
      setTimeout(() => onSymbolResolvedCallback({
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
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
        intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
        volume_precision: 0,
        data_status: 'endofday',
      }), 0)
    },

    getBars: (
      symbolInfo: any,
      resolution: string,
      periodParams: any,
      onHistoryCallback: any,
      onErrorCallback: any
    ) => {
      try {
        const { from, to, countBack } = periodParams
        const bars = generateMockBars(symbolInfo.name, from, to, resolution, countBack)

        if (bars.length === 0) {
          onHistoryCallback([], { noData: true })
          return
        }

        onHistoryCallback(bars, { noData: false })
      } catch (error) {
        onErrorCallback(error instanceof Error ? error.message : 'Error fetching bars')
      }
    },

    // Empty — historical chart only, no live ticks
    subscribeBars: (
      _symbolInfo: any,
      _resolution: string,
      _onRealtimeCallback: any,
      _subscriptionUID: string,
      _onResetCacheCallback: any
    ) => {},

    unsubscribeBars: (_subscriptionUID: string) => {},
  }
}
