import { createClient } from '@supabase/supabase-js'
import { handleTradeImported } from '@/lib/notifications/trade-import-handler'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface MT5Event {
  id: string
  seq: bigint
  event_type: string
  account_login: bigint
  terminal_id: string
  user_id: string
  payload: any
  created_at: string
}

/**
 * Process symbol_spec events - store metadata about traded instruments
 */
export async function processSymbolSpec(event: MT5Event) {
  const { symbol, digits, point, tick_size, tick_value, contract_size, ...rest } = event.payload

  const { error } = await supabase
    .from('mt5_symbol_specs')
    .upsert(
      {
        symbol,
        digits,
        point,
        tick_size,
        tick_value,
        contract_size,
        ...rest,
        captured_at: new Date().toISOString(),
      },
      { onConflict: 'symbol' }
    )

  if (error) console.error('Error storing symbol spec:', error)
}

/**
 * Process account_snapshot events - track account state
 */
export async function processAccountSnapshot(event: MT5Event) {
  const { data: connection } = await supabase
    .from('mt5_connections')
    .select('id')
    .eq('account_login', event.account_login)
    .eq('terminal_id', event.terminal_id)
    .single()

  if (!connection) return

  const { error } = await supabase.from('mt5_account_snapshots').insert({
    connection_id: connection.id,
    account_login: event.account_login,
    ...event.payload,
    captured_at: event.payload.captured_at,
  })

  if (error) console.error('Error storing account snapshot:', error)
}

/**
 * Process position_opened events - create trade entry
 */
export async function processPositionOpened(event: MT5Event) {
  const {
    deal_ticket,
    position_id,
    symbol,
    type,
    volume,
    price,
    time,
    profit,
  } = event.payload

  const { data: connection } = await supabase
    .from('mt5_connections')
    .select('id')
    .eq('account_login', event.account_login)
    .eq('terminal_id', event.terminal_id)
    .single()

  if (!connection) return

  const { data: trade, error } = await supabase
    .from('mt5_processed_trades')
    .insert({
      user_id: event.user_id,
      connection_id: connection.id,
      mt5_ticket: String(position_id),
      position_id,
      deal_ticket,
      symbol,
      direction: type,
      volume,
      entry_price: price,
      entry_time: time,
      profit: profit || 0,
      status: 'open',
      entry_event_id: event.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating trade record:', error)
    return
  }

  // Emit trade imported notification asynchronously
  if (trade?.id) {
    handleTradeImported({
      tradeId: trade.id,
      userId: event.user_id,
      symbol,
      direction: type.toLowerCase() === 'buy' ? 'buy' : 'sell',
      entryPrice: price,
      entryTime: time,
      connectionId: connection.id,
    }).catch((err) =>
      console.error(`[MT5] Failed to handle trade import notification:`, err)
    )
  }
}

/**
 * Process position_closed events - close trade record and calculate final P&L
 */
export async function processPositionClosed(event: MT5Event) {
  const {
    deal_ticket,
    position_id,
    symbol,
    volume,
    price,
    entry,
    time,
    profit,
  } = event.payload

  // Find the corresponding open trade
  const { data: openTrade } = await supabase
    .from('mt5_processed_trades')
    .select('id')
    .eq('position_id', position_id)
    .eq('status', 'open')
    .single()

  if (!openTrade) {
    // If we don't have the open trade, create a new record for this close
    const { data: connection } = await supabase
      .from('mt5_connections')
      .select('id')
      .eq('account_login', event.account_login)
      .eq('terminal_id', event.terminal_id)
      .single()

    if (connection) {
      await supabase
        .from('mt5_processed_trades')
        .insert({
          user_id: event.user_id,
          connection_id: connection.id,
          mt5_ticket: String(position_id),
          position_id,
          deal_ticket,
          symbol,
          direction: entry === 'in' ? 'buy' : 'sell',
          volume,
          exit_price: price,
          exit_time: time,
          profit,
          status: 'closed',
          exit_event_id: event.id,
        })
    }
    return
  }

  // Update the open trade with exit information
  const { error } = await supabase
    .from('mt5_processed_trades')
    .update({
      exit_price: price,
      exit_time: time,
      profit,
      status: 'closed',
      exit_event_id: event.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', openTrade.id)

  if (error) console.error('Error closing trade:', error)
}

/**
 * Process position_partial_close events - partial exit
 */
export async function processPositionPartialClose(event: MT5Event) {
  const {
    deal_ticket,
    position_id,
    symbol,
    volume,
    price,
    time,
    profit,
  } = event.payload

  const { data: connection } = await supabase
    .from('mt5_connections')
    .select('id')
    .eq('account_login', event.account_login)
    .eq('terminal_id', event.terminal_id)
    .single()

  if (!connection) return

  // Create a partial close record
  const { error } = await supabase
    .from('mt5_processed_trades')
    .insert({
      user_id: event.user_id,
      connection_id: connection.id,
      mt5_ticket: String(position_id),
      position_id,
      deal_ticket,
      symbol,
      volume,
      exit_price: price,
      exit_time: time,
      profit,
      status: 'partial_close',
      exit_event_id: event.id,
    })

  if (error) console.error('Error recording partial close:', error)
}

/**
 * Process trade_ohlc events - store candles for replay
 */
export async function processTradeOhlc(event: MT5Event) {
  const { symbol, timeframe, trade_time, candles, ticket } = event.payload

  const { error } = await supabase
    .from('mt5_trade_ohlc')
    .insert({
      mt5_event_id: event.id,
      ticket,
      symbol,
      timeframe,
      trade_time,
      candles: Array.isArray(candles) ? candles : JSON.parse(candles),
    })

  if (error) console.error('Error storing trade OHLC:', error)
}

/**
 * Main dispatcher - route events to appropriate processor
 */
export async function processEvent(event: MT5Event) {
  console.log(`[MT5] Processing event: ${event.event_type} (seq=${event.seq})`)

  try {
    switch (event.event_type) {
      case 'symbol_spec':
        await processSymbolSpec(event)
        break

      case 'account_snapshot':
        await processAccountSnapshot(event)
        break

      case 'position_opened':
        await processPositionOpened(event)
        break

      case 'position_closed':
        await processPositionClosed(event)
        break

      case 'position_partial_close':
        await processPositionPartialClose(event)
        break

      case 'trade_ohlc':
        await processTradeOhlc(event)
        break

      case 'heartbeat':
      case 'terminal_identify':
      case 'positions_sync':
      case 'orders_sync':
      case 'history_sync':
      case 'positions_live_update':
      case 'trade_screenshot':
      case 'position_modified':
      case 'pending_order_created':
      case 'pending_order_modified':
      case 'pending_order_cancelled':
        // These events are captured but don't require immediate processing
        // The heartbeat updates last_event_at, which is handled in the events endpoint
        break

      default:
        console.warn(`Unknown event type: ${event.event_type}`)
    }
  } catch (error) {
    console.error(`Error processing event ${event.id}:`, error)
  }
}

/**
 * Batch process unprocessed events - called periodically
 */
export async function batchProcessEvents() {
  const { data: unprocessedEvents, error } = await supabase
    .from('mt5_events')
    .select('*')
    .is('processed_at', null)
    .order('seq', { ascending: true })
    .limit(100) // Process in batches of 100

  if (error) {
    console.error('Error fetching unprocessed events:', error)
    return
  }

  if (!unprocessedEvents || unprocessedEvents.length === 0) {
    return
  }

  for (const event of unprocessedEvents) {
    await processEvent(event as MT5Event)

    // Mark as processed
    await supabase
      .from('mt5_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', event.id)
  }

  console.log(`[MT5] Processed ${unprocessedEvents.length} events`)
}
