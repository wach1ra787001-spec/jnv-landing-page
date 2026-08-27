import { createClient } from '@/lib/supabase/server'
import { detectTradeSession } from '@/lib/session-detection-engine'
import { getSelectedAccountId } from '@/lib/get-selected-account'

// Valid source values allowed by database constraint (matches database ENUM)
const VALID_SOURCES = ['manual', 'mt5', 'mt4', 'ctrader', 'tradingview', 'csv'] as const
export type TradeSource = typeof VALID_SOURCES[number]

/**
 * Normalize and validate trade source
 * @throws Error if source is invalid
 */
export function normalizeTradeSource(source?: string | null): TradeSource {
  if (!source) {
    return 'manual'
  }

  const normalized = source.toLowerCase().trim()
  
  if (!VALID_SOURCES.includes(normalized as TradeSource)) {
    throw new Error(
      `Invalid trade source: "${source}". Must be one of: ${VALID_SOURCES.join(', ')}`
    )
  }

  return normalized as TradeSource
}

export interface CreateTradeInput {
  symbol: string
  direction: 'BUY' | 'SELL' | 'buy' | 'sell' | 'long' | 'short'
  entry_price: number
  exit_price?: number | null
  stop_loss?: number | null
  take_profit?: number | null
  quantity: number
  entry_time: string
  exit_time: string
  pnl: number
  pnl_percent: number
  r_multiple?: number | null
  risk_amount?: number | null
  notes?: string
  screenshots?: string[]
  screenshot_urls?: string[]
  strategy?: string
  setup_type?: string
  emotion_before?: string
  status?: string
  source?: string | null
  mt5_ticket?: number | null
  /** User's UTC offset in hours (e.g., 3 for UTC+3, -4 for UTC-4). If not provided, trades table will use existing session value or null. */
  user_utc_offset?: number | null
  account_id?: string | null
  playbook_id?: string | null
  followed_rule_ids?: string[]
  followed_rules?: string
}

/**
 * Get user's UTC offset from their profile
 * The profile stores the user's selected UTC offset
 */
async function getUserUtcOffset(userId: string): Promise<number | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('[v0] Could not fetch user preferences:', error)
      return null
    }

    // Check if preferences contains utc_offset
    if (data?.preferences?.utc_offset !== undefined && data.preferences.utc_offset !== null) {
      const offset = Number(data.preferences.utc_offset)
      if (!isNaN(offset)) {
        console.log('[v0] Found user UTC offset in preferences:', offset)
        return offset
      }
    }

    return null
  } catch (err) {
    console.warn('[v0] Error getting user UTC offset:', err)
    return null
  }
}

export async function createTrade(tradeData: CreateTradeInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to create trades')
  }

  console.log('[v0] Creating trade for user:', user.id)
  console.log('[v0] Trade data:', tradeData)

  // Ensure direction is properly formatted - database expects 'long' or 'short'
  const directionInput = String(tradeData.direction).toLowerCase().trim()
  let direction: 'long' | 'short'
  
  if (directionInput === 'buy' || directionInput === 'long') {
    direction = 'long'
  } else if (directionInput === 'sell' || directionInput === 'short') {
    direction = 'short'
  } else {
    throw new Error(`Invalid direction: ${directionInput}. Must be buy/long or sell/short`)
  }

  // Normalize source - defaults to 'manual' if not specified
  const normalizedSource = normalizeTradeSource(tradeData.source)

  // Determine trading session
  let sessionName: string | null = null

  // Get user's UTC offset (from input or from profile)
  let userUtcOffset = tradeData.user_utc_offset
  if (userUtcOffset === undefined || userUtcOffset === null) {
    userUtcOffset = await getUserUtcOffset(user.id)
  }

  if (userUtcOffset !== null && userUtcOffset !== undefined) {
    const detectionResult = detectTradeSession(tradeData.entry_time, userUtcOffset)
    if (detectionResult.is_valid) {
      sessionName = detectionResult.session_name
      console.log('[v0] Detected session:', sessionName, 'from UTC offset:', userUtcOffset)
      console.log('[v0] Session detection details:', {
        documented_time: detectionResult.documented_trade_time,
        utc_time: detectionResult.calculated_utc_time,
        session: detectionResult.session_name,
      })
    } else {
      console.warn('[v0] Session detection failed:', detectionResult.error)
    }
  } else {
    console.log('[v0] No UTC offset available - session will not be detected')
  }

  const insertData: any = {
    user_id: user.id,
    symbol: tradeData.symbol.trim().toUpperCase(),
    direction: direction,
    entry_price: tradeData.entry_price,
    exit_price: tradeData.exit_price || null,
    quantity: tradeData.quantity,
    entry_time: tradeData.entry_time,
    exit_time: tradeData.exit_time,
    pnl: tradeData.pnl,
    pnl_percent: tradeData.pnl_percent,
    stop_loss: tradeData.stop_loss || null,
    take_profit: tradeData.take_profit || null,
    r_multiple: tradeData.r_multiple || null,
    risk_amount: tradeData.risk_amount || null,
    setup_type: (tradeData.setup_type || '').trim(),
    strategy: (tradeData.strategy || '').trim(),
    status: tradeData.status || 'closed',
    source: normalizedSource,
    screenshot_urls: tradeData.screenshot_urls || [],
    session: sessionName,
    account_id: tradeData.account_id || null,
    playbook_id: tradeData.playbook_id || null,
    followed_rule_ids: Array.isArray(tradeData.followed_rule_ids) ? tradeData.followed_rule_ids : [],
    followed_rules: tradeData.followed_rules || '',
  }
  
  console.log('[v0] Screenshot URLs being saved:', tradeData.screenshot_urls?.length || 0, 'files')
  
  // Only set mt5_ticket for MT5 imported trades to avoid unique constraint violations
  // Manual trades don't have mt5_ticket - the database will default to null
  if (normalizedSource === 'mt5' && tradeData.mt5_ticket) {
    insertData.mt5_ticket = tradeData.mt5_ticket
  }

  console.log('[v0] Inserting trade data:', { symbol: insertData.symbol, direction: insertData.direction, user_id: insertData.user_id, source: normalizedSource, session: insertData.session })

  const { data, error } = await supabase
    .from('trades')
    .insert(insertData)
    .select()

  if (error) {
    console.error('[v0] Error creating trade:', error.message)
    throw new Error(`Failed to create trade: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned after insert')
  }

  const createdTrade = data[0]
  console.log('[v0] Trade created successfully with ID:', createdTrade.id)
  console.log('[v0] Saved screenshot_urls from DB:', createdTrade.screenshot_urls)
  console.log('[v0] Saved session from DB:', createdTrade.session)

  // If notes are provided, create a trade note
  if (tradeData.notes && tradeData.notes.trim()) {
    try {
      const { error: noteError } = await supabase
        .from('trade_notes')
        .insert({
          user_id: user.id,  // ✅ Include user_id (required by NOT NULL constraint)
          trade_id: createdTrade.id,
          note: tradeData.notes.trim(),
        })

      if (noteError) {
        console.error('[v0] Error creating trade note:', noteError)
        // Don't throw - trade was created successfully, note just failed
      } else {
        console.log('[v0] Trade note created successfully')
      }
    } catch (err) {
      console.error('[v0] Exception creating trade note:', err)
      // Don't throw - trade was created successfully
    }
  }

  return createdTrade
}

export async function getUserTrades() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to fetch trades')
  }

  console.log('[v0] Fetching trades for user:', user.id)

  // Resolve the active account: explicit cookie selection first, then the
  // saved default, then the most recently created account.
  const accountId = await getSelectedAccountId(supabase, user.id)

  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_time', { ascending: false })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[v0] Error fetching trades:', error)
    throw error
  }

  console.log('[v0] Fetched trades:', data?.length || 0, 'for account:', accountId)
  return data || []
}

export async function getTradeById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to fetch trades')
  }

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[v0] Error fetching trade:', error)
    throw error
  }

  return data
}

export async function calculateTradeMetrics(userId: string) {
  const supabase = await createClient()

  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('[v0] Error fetching trades for metrics:', error)
    throw error
  }

  if (!trades || trades.length === 0) {
    return {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      total_pnl: 0,
      average_win: 0,
      average_loss: 0,
    }
  }

  const totalTrades = trades.length
  const winningTrades = trades.filter((t) => (t.pnl || 0) >= 0).length
  const losingTrades = totalTrades - winningTrades
  const winRate = (winningTrades / totalTrades) * 100

  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const wins = trades.filter((t) => (t.pnl || 0) > 0)
  const losses = trades.filter((t) => (t.pnl || 0) < 0)

  const averageWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0
  const averageLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / losses.length : 0

  return {
    total_trades: totalTrades,
    winning_trades: winningTrades,
    losing_trades: losingTrades,
    win_rate: winRate,
    total_pnl: totalPnl,
    average_win: averageWin,
    average_loss: averageLoss,
  }
}
