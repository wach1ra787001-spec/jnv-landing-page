import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EconomicEvent } from '@/types/economic'

/**
 * GET /api/economic-calendar/events
 *
 * Frontend endpoint for reading economic events.
 * Authenticated users only.
 *
 * Query params:
 *   from: date string (default = today)
 *   to: date string (default = today + 7 days)
 *   impact: 'high' | 'medium' | 'low'
 *   currency: 'USD' | 'EUR' | etc
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user - this will fail if not authenticated
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)

    // Default: today to today + 7 days
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const from = searchParams.get('from')
      ? new Date(searchParams.get('from') as string)
      : today

    const to = searchParams.get('to')
      ? new Date(searchParams.get('to') as string)
      : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const impact = searchParams.get('impact') as string | null
    const currency = searchParams.get('currency')?.toUpperCase() || null

    // Query database
    let query = supabase
      .from('economic_events')
      .select('*')
      .gte('event_time_utc', from.toISOString())
      .lte('event_time_utc', to.toISOString())
      .order('event_time_utc', { ascending: true })

    // Apply optional filters
    if (impact && ['high', 'medium', 'low', 'holiday'].includes(impact)) {
      query = query.eq('impact', impact)
    }

    if (currency) {
      query = query.eq('currency', currency)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('[EconomicCalendar] Query error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      events: events || [],
      count: events?.length || 0,
      from: from.toISOString(),
      to: to.toISOString(),
      filters: {
        impact: impact || null,
        currency: currency || null,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[EconomicCalendar] Error:', errorMsg)

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
