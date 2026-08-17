import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * MT5 OHLC Data Endpoint
 * 
 * Fetches historical OHLC data from mt5_trade_ohlc table for TradingView charts
 * 
 * Query Parameters:
 * - symbol: Trading pair (e.g., "EURUSD")
 * - interval: Timeframe in minutes (1, 5, 15, 30, 60, 240, 1440)
 * - from: Unix timestamp (seconds)
 * - to: Unix timestamp (seconds)
 * 
 * Returns:
 * {
 *   bars: [{ time, open, high, low, close, volume }, ...]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const interval = searchParams.get('interval')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Validate parameters
    if (!symbol || !interval || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: symbol, interval, from, to' },
        { status: 400 }
      )
    }

    const fromTime = parseInt(from)
    const toTime = parseInt(to)

    if (isNaN(fromTime) || isNaN(toTime)) {
      return NextResponse.json(
        { error: 'Invalid timestamp parameters' },
        { status: 400 }
      )
    }

    // Convert interval to minutes if it's in "D" or "W" format
    let intervalMinutes = parseInt(interval)
    if (interval.endsWith('D')) {
      intervalMinutes = parseInt(interval) * 1440
    } else if (interval.endsWith('W')) {
      intervalMinutes = parseInt(interval) * 10080
    } else if (interval.endsWith('M')) {
      intervalMinutes = parseInt(interval) * 43200
    }

    // Query mt5_trade_ohlc for candle data
    const { data, error } = await supabase
      .from('mt5_trade_ohlc')
      .select('time, open, high, low, close, volume')
      .eq('symbol', symbol)
      .eq('interval', intervalMinutes)
      .gte('time', fromTime)
      .lte('time', toTime)
      .order('time', { ascending: true })

    if (error) {
      console.error('[MT5 OHLC API] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch OHLC data' },
        { status: 500 }
      )
    }

    // If no data from mt5_trade_ohlc, try mt5_processed_trades as fallback
    if (!data || data.length === 0) {
      const { data: trades, error: tradesError } = await supabase
        .from('mt5_processed_trades')
        .select('entry_price, exit_price, entry_time, exit_time, high_price, low_price')
        .eq('symbol', symbol)
        .gte('entry_time', fromTime)
        .lte('entry_time', toTime)
        .order('entry_time', { ascending: true })

      if (tradesError) {
        console.error('[MT5 OHLC API] Trades query error:', tradesError)
        return NextResponse.json(
          { bars: [] },
          { status: 200 }
        )
      }

      // Build synthetic OHLC from trade data (for demo purposes)
      const bars = trades?.map((trade: any) => ({
        time: Math.floor(trade.entry_time),
        open: trade.entry_price,
        high: trade.high_price || Math.max(trade.entry_price, trade.exit_price || 0),
        low: trade.low_price || Math.min(trade.entry_price, trade.exit_price || 0),
        close: trade.exit_price || trade.entry_price,
        volume: 0,
      })) || []

      return NextResponse.json(
        { bars },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=60',
          },
        }
      )
    }

    // Return formatted OHLC bars
    return NextResponse.json(
      { bars: data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        },
      }
    )
  } catch (error) {
    console.error('[MT5 OHLC API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
