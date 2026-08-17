import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchFromForexFactory } from '@/lib/forexFactoryFallback'
import { EconomicEvent, FMPEvent, CalendarSyncResult } from '@/types/economic'

/**
 * GET /api/economic-calendar/sync
 *
 * Fetches economic events from Financial Modeling Prep (FMP) API and stores them in the database.
 * Protected by CRON_SECRET header.
 * Runs daily via Vercel Cron at 02:00 UTC to fetch next 30 days of events.
 */

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Calculate date range: today to today + 30 days
    const from = new Date()
    from.setUTCHours(0, 0, 0, 0)

    const to = new Date(from)
    to.setUTCDate(to.getUTCDate() + 30)

    const fromStr = from.toISOString().split('T')[0] // YYYY-MM-DD
    const toStr = to.toISOString().split('T')[0]

    console.log(`[EconomicCalendar] Syncing events from ${fromStr} to ${toStr}`)

    let events: EconomicEvent[] = []
    let source = 'unknown'
    let errors: string[] = []

    // Try FMP API first
    if (process.env.FMP_API_KEY) {
      try {
        events = await fetchFromFMP(fromStr, toStr)
        source = 'fmp'
        console.log(`[EconomicCalendar] Fetched ${events.length} events from FMP`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('[EconomicCalendar] FMP failed:', errorMsg)
        errors.push(`FMP: ${errorMsg}`)
      }
    } else {
      errors.push('FMP_API_KEY not configured')
    }

    // Fallback to ForexFactory if FMP failed or not configured
    if (events.length === 0) {
      try {
        events = await fetchFromForexFactory()
        source = 'forexfactory'
        console.log(`[EconomicCalendar] Fetched ${events.length} events from ForexFactory`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('[EconomicCalendar] ForexFactory failed:', errorMsg)
        errors.push(`ForexFactory: ${errorMsg}`)
      }
    }

    if (events.length === 0) {
      return NextResponse.json({
        fetched: 0,
        upserted: 0,
        errors,
        from: fromStr,
        to: toStr,
        source,
      } as CalendarSyncResult)
    }

    // Upsert into database
    const { data: upserted, error: upsertError } = await supabase
      .from('economic_events')
      .upsert(events, {
        onConflict: 'source, source_id, event_time_utc',
        ignoreDuplicates: false, // Update if values changed
      })
      .select()

    if (upsertError) {
      console.error('[EconomicCalendar] Upsert error:', upsertError)
      errors.push(`Database upsert: ${upsertError.message}`)
      return NextResponse.json(
        {
          fetched: events.length,
          upserted: 0,
          errors,
          from: fromStr,
          to: toStr,
          source,
        } as CalendarSyncResult,
        { status: 500 }
      )
    }

    console.log(`[EconomicCalendar] Sync complete: ${events.length} fetched, ${upserted?.length || 0} upserted`)

    return NextResponse.json({
      fetched: events.length,
      upserted: upserted?.length || 0,
      errors,
      from: fromStr,
      to: toStr,
      source,
    } as CalendarSyncResult)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[EconomicCalendar] Sync error:', errorMsg)

    return NextResponse.json(
      {
        fetched: 0,
        upserted: 0,
        errors: [errorMsg],
        from: '',
        to: '',
        source: 'unknown',
      } as CalendarSyncResult,
      { status: 500 }
    )
  }
}

/**
 * Fetch from Financial Modeling Prep (FMP) API
 * FMP provides free economic calendar data for US indicators
 */
async function fetchFromFMP(
  from: string,
  to: string
): Promise<EconomicEvent[]> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) throw new Error('FMP_API_KEY not set')

  // FMP Endpoint: /economic-calendar
  // Returns US economic events in date range
  const url = new URL('https://financialmodelingprep.com/api/v3/economic-calendar')
  url.searchParams.append('apikey', apiKey)
  url.searchParams.append('from', from)
  url.searchParams.append('to', to)

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`FMP API returned ${res.status}: ${res.statusText}`)
  }

  const rawEvents = (await res.json()) as FMPEvent[]

  if (!Array.isArray(rawEvents)) {
    throw new Error('FMP API returned unexpected format')
  }

  // Map FMP format to our schema
  const events: EconomicEvent[] = rawEvents
    .filter((event) => {
      // Only include events with release times and countries
      return event.date && event.country
    })
    .map((event) => {
      // Parse date and time
      const dateTimeStr = `${event.date}T${event.time || '08:30'}:00Z`
      const eventTime = new Date(dateTimeStr)

      return {
        id: crypto.randomUUID(),
        event_name: event.event || 'Unknown Event',
        currency: event.country?.toUpperCase() === 'USA' ? 'USD' : 'USD', // FMP is primarily US data
        impact: mapFMPImpact(event.impact),
        event_time_utc: eventTime.toISOString(),
        forecast: event.forecast ? parseFloat(event.forecast) : null,
        actual: event.actual ? parseFloat(event.actual) : null,
        previous: event.previous ? parseFloat(event.previous) : null,
        revised: event.revised ? parseFloat(event.revised) : null,
        surprise_pct: event.changePercent ? parseFloat(event.changePercent) : null,
        source: 'fmp',
        source_id: `fmp_${event.event}_${event.date}_${event.time}`,
        country: event.country || 'USA',
        is_released: !!event.actual,
        is_revised: !!event.revised,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

  return events
}

/**
 * Map FMP impact levels to our schema
 * FMP: "High", "Medium", "Low"
 */
function mapFMPImpact(
  impact: string
): 'high' | 'medium' | 'low' | 'holiday' {
  if (!impact) return 'low'

  const lower = impact.toLowerCase()

  if (lower.includes('high')) return 'high'
  if (lower.includes('medium')) return 'medium'
  if (lower.includes('low')) return 'low'

  return 'low'
}

