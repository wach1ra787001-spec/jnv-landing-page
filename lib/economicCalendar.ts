'use server'

import { createClient } from '@/lib/supabase/server'
import { EconomicEvent, TradeWithNews, NewsImpactAnalysis } from '@/types/economic'

/**
 * Economic Calendar Utility Functions
 * Used by Advanced Statistics to correlate trades with news events
 */

/**
 * Get high-impact events in a date range
 */
export async function getHighImpactEvents(
  from: Date,
  to: Date,
  currencies?: string[]
): Promise<EconomicEvent[]> {
  const supabase = await createClient()

  let query = supabase
    .from('economic_events')
    .select('*')
    .eq('impact', 'high')
    .gte('event_time_utc', from.toISOString())
    .lte('event_time_utc', to.toISOString())
    .order('event_time_utc', { ascending: true })

  if (currencies && currencies.length > 0) {
    query = query.in('currency', currencies)
  }

  const { data, error } = await query

  if (error) {
    console.error('[EconomicCalendar] Error fetching high-impact events:', error)
    return []
  }

  return data || []
}

/**
 * Check if a trade timestamp is within N minutes of a high-impact event
 */
export async function isNearNewsEvent(
  tradeTime: Date,
  windowMinutes: number = 30,
  currencies?: string[]
): Promise<boolean> {
  const supabase = await createClient()

  const windowMs = windowMinutes * 60 * 1000
  const from = new Date(tradeTime.getTime() - windowMs)
  const to = new Date(tradeTime.getTime() + windowMs)

  let query = supabase
    .from('economic_events')
    .select('id', { count: 'exact' })
    .eq('impact', 'high')
    .gte('event_time_utc', from.toISOString())
    .lte('event_time_utc', to.toISOString())

  if (currencies && currencies.length > 0) {
    query = query.in('currency', currencies)
  }

  const { count, error } = await query

  if (error) {
    console.error('[EconomicCalendar] Error checking news proximity:', error)
    return false
  }

  return (count || 0) > 0
}

/**
 * Get events within a window around a trade timestamp
 */
export async function getEventsNearTrade(
  tradeTime: Date,
  windowMinutes: number = 30
): Promise<EconomicEvent[]> {
  const supabase = await createClient()

  const windowMs = windowMinutes * 60 * 1000
  const from = new Date(tradeTime.getTime() - windowMs)
  const to = new Date(tradeTime.getTime() + windowMs)

  const { data, error } = await supabase
    .from('economic_events')
    .select('*')
    .gte('event_time_utc', from.toISOString())
    .lte('event_time_utc', to.toISOString())
    .order('event_time_utc', { ascending: true })

  if (error) {
    console.error('[EconomicCalendar] Error fetching events near trade:', error)
    return []
  }

  return data || []
}

/**
 * Tag trades with nearest news event
 * Used for correlating trades with economic releases
 */
export async function tagTradesWithNews(
  trades: any[],
  windowMinutes: number = 30
): Promise<TradeWithNews[]> {
  const supabase = await createClient()

  const tradesWithNews: TradeWithNews[] = await Promise.all(
    trades.map(async (trade) => {
      const tradeTime = new Date(trade.entry_time)
      const windowMs = windowMinutes * 60 * 1000
      const from = new Date(tradeTime.getTime() - windowMs)
      const to = new Date(tradeTime.getTime() + windowMs)

      const { data: events } = await supabase
        .from('economic_events')
        .select('*')
        .gte('event_time_utc', from.toISOString())
        .lte('event_time_utc', to.toISOString())
        .order('event_time_utc', { ascending: true })

      let nearest_event: EconomicEvent | null = null
      let minutes_from_news: number | null = null
      let is_near_high_impact = false

      if (events && events.length > 0) {
        // Find nearest event to trade
        let minDiff = Infinity
        events.forEach((event: EconomicEvent) => {
          const eventTime = new Date(event.event_time_utc)
          const diff = Math.abs(eventTime.getTime() - tradeTime.getTime())
          if (diff < minDiff) {
            minDiff = diff
            nearest_event = event
            minutes_from_news = Math.round(diff / 60000)
            is_near_high_impact = event.impact === 'high'
          }
        })
      }

      return {
        ...trade,
        nearest_event,
        minutes_from_news,
        is_near_high_impact,
      }
    })
  )

  return tradesWithNews
}

/**
 * Get events by currency in date range
 */
export async function getEventsByCurrency(
  currency: string,
  from: Date,
  to: Date
): Promise<EconomicEvent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('economic_events')
    .select('*')
    .eq('currency', currency.toUpperCase())
    .gte('event_time_utc', from.toISOString())
    .lte('event_time_utc', to.toISOString())
    .order('event_time_utc', { ascending: true })

  if (error) {
    console.error('[EconomicCalendar] Error fetching events by currency:', error)
    return []
  }

  return data || []
}

/**
 * Analyze news impact on trades
 * Splits trades into those near news vs normal trading
 */
export async function analyzeNewsImpact(
  trades: any[],
  windowMinutes: number = 30,
  currencies?: string[]
): Promise<NewsImpactAnalysis> {
  const tradesWithNews = await tagTradesWithNews(trades, windowMinutes)

  // Split trades
  const nearNews = tradesWithNews.filter((t) => t.is_near_high_impact)
  const normalTime = tradesWithNews.filter((t) => !t.is_near_high_impact)

  // Calculate stats
  function calculateStats(tradesGroup: TradeWithNews[]) {
    if (tradesGroup.length === 0) {
      return {
        trades: [],
        winRate: 0,
        avgPnl: 0,
      }
    }

    const winners = tradesGroup.filter((t) => t.pnl > 0).length
    const winRate = (winners / tradesGroup.length) * 100
    const avgPnl = tradesGroup.reduce((sum, t) => sum + (t.pnl || 0), 0) / tradesGroup.length

    return {
      trades: tradesGroup,
      winRate,
      avgPnl,
    }
  }

  return {
    nearNews: calculateStats(nearNews),
    normalTime: calculateStats(normalTime),
  }
}
