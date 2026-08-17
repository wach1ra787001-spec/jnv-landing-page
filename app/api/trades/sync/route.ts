import { createClient } from '@/lib/supabase/server'
import { normalizeTradeSource } from '@/lib/services/trade-service'
import { NextRequest, NextResponse } from 'next/server'

interface MT5Trade {
  ticket: string
  symbol: string
  type: number
  volume: number
  open_price: number
  close_price: number
  open_time: string
  close_time: string
  commission: number
  swap: number
  profit: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's MT5 connection
    const { data: connection } = await supabase
      .from('broker_connections')
      .select('connection_token')
      .eq('user_id', user.id)
      .eq('broker_type', 'mt5')
      .single()

    if (!connection?.connection_token) {
      return NextResponse.json(
        { error: 'No MT5 connection found' },
        { status: 400 }
      )
    }

    // Call Python bridge to fetch trades
    const pythonBridgeUrl = process.env.PYTHON_BRIDGE_URL || 'http://localhost:8000'
    const response = await fetch(`${pythonBridgeUrl}/api/mt5/trades`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${connection.connection_token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Failed to fetch trades from MT5' },
        { status: response.status }
      )
    }

    const { trades }: { trades: MT5Trade[] } = await response.json()

    // Transform MT5 trades to app format
    const mt5Source = normalizeTradeSource('mt5')
    const formattedTrades = trades.map(trade => ({
      user_id: user.id,
      symbol: trade.symbol,
      direction: trade.type === 0 ? 'long' : 'short',
      quantity: trade.volume,
      entry_price: trade.open_price,
      exit_price: trade.close_price,
      entry_time: new Date(trade.open_time).toISOString(),
      exit_time: new Date(trade.close_time).toISOString(),
      pnl: trade.profit,
      commission: trade.commission,
      swap: trade.swap,
      mt5_ticket: trade.ticket,
      source: mt5Source,
      created_at: new Date().toISOString(),
    }))

    // Insert trades (upsert to avoid duplicates using mt5_ticket)
    const { data: insertedTrades, error: insertError } = await supabase
      .from('trades')
      .upsert(formattedTrades, { onConflict: 'mt5_ticket' })
      .select()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to save trades' },
        { status: 500 }
      )
    }

    // Update last sync time
    await supabase
      .from('broker_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('broker_type', 'mt5')

    return NextResponse.json({
      success: true,
      message: `Synced ${insertedTrades?.length || 0} trades`,
      trades_count: insertedTrades?.length || 0,
    })
  } catch (error) {
    console.error('Trade sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
