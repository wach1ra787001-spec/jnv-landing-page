/**
 * Example API Route: Timezone-Aware Trade Analytics
 * 
 * This demonstrates how to:
 * 1. Query trades in UTC from database
 * 2. Use user's timezone for session classification
 * 3. Return data ready for frontend display
 * 4. Handle timezone-based filtering
 */

import { createClient } from '@/lib/supabase/server'
import { TimeService } from '@/lib/services/time-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's timezone from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.timezone) {
      return NextResponse.json({ error: 'Timezone not set' }, { status: 400 })
    }

    // Create TimeService with user's timezone
    const timeService = new TimeService(profile.timezone)

    // Fetch all trades for this user (stored in UTC)
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .not('exit_time', 'is', null)
      .order('entry_time', { ascending: false })
      .limit(100)

    if (tradesError) throw tradesError

    // Process trades: group by session, add timezone data
    const processedTrades = trades.map((trade) => {
      const session = timeService.getSessionFromUTC(trade.entry_time)
      const holdingMinutes = timeService.getHoldingTimeMinutes(
        trade.entry_time,
        trade.exit_time,
      )
      const nearNews = timeService.isNearNewsTime(trade.entry_time, 30)

      return {
        ...trade,
        session,
        holdingMinutes,
        holdingBucket: timeService.getHoldingTimeBucket(holdingMinutes),
        nearNews,
        // Format times for display (in user's timezone)
        entryTimeDisplay: timeService.format(trade.entry_time, 'MMM dd, HH:mm'),
        exitTimeDisplay: timeService.format(trade.exit_time, 'MMM dd, HH:mm'),
        entryTimeDate: timeService.formatDate(trade.entry_time),
        timeZone: profile.timezone,
      }
    })

    // Calculate session statistics
    const sessionStats = processedTrades.reduce(
      (acc, trade) => {
        if (!acc[trade.session]) {
          acc[trade.session] = {
            count: 0,
            wins: 0,
            losses: 0,
            totalPnL: 0,
            avgPnL: 0,
          }
        }

        acc[trade.session].count++
        if (trade.pnl > 0) acc[trade.session].wins++
        if (trade.pnl < 0) acc[trade.session].losses++
        acc[trade.session].totalPnL += trade.pnl

        return acc
      },
      {} as Record<
        string,
        {
          count: number
          wins: number
          losses: number
          totalPnL: number
          avgPnL: number
        }
      >,
    )

    // Calculate averages
    Object.keys(sessionStats).forEach((session) => {
      sessionStats[session].avgPnL =
        sessionStats[session].totalPnL / sessionStats[session].count
    })

    // Holding time analysis
    const holdingTimeAnalysis = processedTrades.reduce(
      (acc, trade) => {
        const bucket = trade.holdingBucket
        if (!acc[bucket]) {
          acc[bucket] = {
            count: 0,
            wins: 0,
            avgPnL: 0,
            totalPnL: 0,
          }
        }

        acc[bucket].count++
        if (trade.pnl > 0) acc[bucket].wins++
        acc[bucket].totalPnL += trade.pnl

        return acc
      },
      {} as Record<
        string,
        { count: number; wins: number; avgPnL: number; totalPnL: number }
      >,
    )

    Object.keys(holdingTimeAnalysis).forEach((bucket) => {
      holdingTimeAnalysis[bucket].avgPnL =
        holdingTimeAnalysis[bucket].totalPnL / holdingTimeAnalysis[bucket].count
    })

    // News time impact analysis
    const newsImpactStats = {
      nearNews: {
        count: 0,
        wins: 0,
        totalPnL: 0,
        avgPnL: 0,
      },
      normalTime: {
        count: 0,
        wins: 0,
        totalPnL: 0,
        avgPnL: 0,
      },
    }

    processedTrades.forEach((trade) => {
      const key = trade.nearNews ? 'nearNews' : 'normalTime'
      newsImpactStats[key].count++
      if (trade.pnl > 0) newsImpactStats[key].wins++
      newsImpactStats[key].totalPnL += trade.pnl
    })

    Object.keys(newsImpactStats).forEach((key) => {
      newsImpactStats[key as keyof typeof newsImpactStats].avgPnL =
        newsImpactStats[key as keyof typeof newsImpactStats].totalPnL /
        newsImpactStats[key as keyof typeof newsImpactStats].count
    })

    return NextResponse.json({
      success: true,
      data: {
        trades: processedTrades,
        sessionStats,
        holdingTimeAnalysis,
        newsImpactStats,
        userTimezone: profile.timezone,
        timezoneOffset: timeService.getTimezoneOffset(),
      },
    })
  } catch (error) {
    console.error('[API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * Example: Query trades for a specific date in user's timezone
 * 
 * POST body:
 * {
 *   "targetDate": "2024-01-15" // User's local date
 * }
 * 
 * This finds all trades that occurred on that date in the user's timezone,
 * even though they're stored as UTC timestamps
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { targetDate } = body // Format: YYYY-MM-DD

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's timezone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.timezone) {
      return NextResponse.json({ error: 'Timezone not set' }, { status: 400 })
    }

    const timeService = new TimeService(profile.timezone)

    // Get UTC boundaries for the target date in user's timezone
    // Create a date object from the user's local date string
    const [year, month, day] = targetDate.split('-').map(Number)
    const userDate = new Date(year, month - 1, day)

    const { start: utcStart, end: utcEnd } = timeService.getDayBoundariesInUTC(userDate)

    // Query trades within these UTC boundaries
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_time', utcStart.toISOString())
      .lt('entry_time', utcEnd.toISOString())
      .order('entry_time', { ascending: true })

    if (tradesError) throw tradesError

    // Enrich with timezone info
    const enrichedTrades = trades.map((trade) => ({
      ...trade,
      session: timeService.getSessionFromUTC(trade.entry_time),
      entryTimeDisplay: timeService.format(trade.entry_time, 'HH:mm'),
      exitTimeDisplay: trade.exit_time ? timeService.format(trade.exit_time, 'HH:mm') : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        userTimezone: profile.timezone,
        trades: enrichedTrades,
        utcBoundaries: {
          start: utcStart.toISOString(),
          end: utcEnd.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('[API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
