import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/manual-sync
 *
 * Manual endpoint to fetch FMP economic calendar data.
 * This is useful for immediate syncs without waiting for cron.
 * Returns detailed summary of fetch and import process.
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Only authenticated users can trigger manual sync
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[Manual Sync] Triggered by user: ${user.id}`)

    const FMP_API_KEY = process.env.FMP_API_KEY
    if (!FMP_API_KEY) {
      return NextResponse.json(
        { error: 'FMP_API_KEY not configured on server' },
        { status: 500 }
      )
    }

    // Calculate date range
    const from = new Date()
    from.setUTCHours(0, 0, 0, 0)

    const to = new Date(from)
    to.setUTCDate(to.getUTCDate() + 30)

    const fromStr = from.toISOString().split('T')[0]
    const toStr = to.toISOString().split('T')[0]

    console.log(`[Manual Sync] Fetching events from ${fromStr} to ${toStr}`)

    // Fetch from FMP
    const url = new URL('https://financialmodelingprep.com/api/v3/economic-calendar')
    url.searchParams.append('apikey', FMP_API_KEY)
    url.searchParams.append('from', fromStr)
    url.searchParams.append('to', toStr)

    const fmpResponse = await fetch(url.toString())
    if (!fmpResponse.ok) {
      throw new Error(`FMP API returned ${fmpResponse.status}`)
    }

    const rawEvents = await fmpResponse.json()
    if (!Array.isArray(rawEvents)) {
      throw new Error('FMP returned unexpected format')
    }

    console.log(`[Manual Sync] Received ${rawEvents.length} events from FMP`)

    // Filter for major indicators and countries
    const majorIndicators = ['CPI', 'NFP', 'ISM', 'unemployment', 'inflation', 'manufacturing', 'ADP', 'jobless', 'retail', 'housing', 'PMI', 'confidence']
    const majorCountries = ['USA', 'UK', 'EUR', 'Japan', 'China', 'Canada', 'Australia', 'Switzerland', 'Sweden', 'Mexico', 'New Zealand']

    const filteredEvents = rawEvents.filter(event => {
      const eventName = (event.event || '').toUpperCase()
      const country = (event.country || '').toUpperCase()
      const isMajorIndicator = majorIndicators.some(ind => eventName.includes(ind.toUpperCase()))
      const isMajorCountry = majorCountries.some(c => country.includes(c))
      return isMajorIndicator || isMajorCountry
    })

    console.log(`[Manual Sync] Filtered to ${filteredEvents.length} high-impact events`)

    // Map to schema
    const events = filteredEvents.map(event => {
      const dateTimeStr = `${event.date}T${event.time || '08:30'}:00Z`
      const eventTime = new Date(dateTimeStr)

      return {
        event_name: event.event || 'Unknown Event',
        currency: 'USD',
        impact: mapImpact(event.impact),
        event_time_utc: eventTime.toISOString(),
        forecast: event.forecast ? parseFloat(event.forecast) : null,
        actual: event.actual ? parseFloat(event.actual) : null,
        previous: event.previous ? parseFloat(event.previous) : null,
        revised: event.revised ? parseFloat(event.revised) : null,
        surprise_pct: event.changePercent ? parseFloat(event.changePercent) : null,
        source: 'fmp',
        source_id: `fmp_${event.event}_${event.date}_${event.time || '08:30'}`,
        country: event.country || 'USA',
        is_released: !!event.actual,
        is_revised: !!event.revised,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    // Batch upsert
    let totalUpserted = 0
    const batchSize = 50

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)
      const { data: upserted, error } = await supabase
        .from('economic_events')
        .upsert(batch, {
          onConflict: 'source, source_id, event_time_utc',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error('[Manual Sync] Upsert error:', error)
        throw error
      }

      totalUpserted += upserted?.length || 0
    }

    // Summary stats
    const { count: totalFmpEvents } = await supabase
      .from('economic_events')
      .select('*', { count: 'exact' })
      .eq('source', 'fmp')

    // Group by impact
    const { data: byImpact } = await supabase
      .from('economic_events')
      .select('impact')
      .eq('source', 'fmp')

    const impactStats = byImpact?.reduce((acc, e) => {
      acc[e.impact] = (acc[e.impact] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      summary: {
        fetched_from_fmp: rawEvents.length,
        filtered_high_impact: events.length,
        saved_to_db: totalUpserted,
        total_fmp_events_in_db: totalFmpEvents,
        date_range: { from: fromStr, to: toStr },
        impact_distribution: impactStats,
        timestamp: new Date().toISOString(),
      },
      message: `Successfully synced ${totalUpserted} high-impact economic events`,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[Manual Sync] Error:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}

function mapImpact(impact: string): 'high' | 'medium' | 'low' {
  if (!impact) return 'low'
  const lower = impact.toLowerCase()
  if (lower.includes('high')) return 'high'
  if (lower.includes('medium')) return 'medium'
  return 'low'
}
