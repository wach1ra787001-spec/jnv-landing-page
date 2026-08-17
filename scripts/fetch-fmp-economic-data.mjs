#!/usr/bin/env node

/** Manual script to fetch economic calendar data from FMP and save to database */

import { createClient } from '@supabase/supabase-js'

const FMP_API_KEY = process.env.FMP_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!FMP_API_KEY) {
  throw new Error('FMP_API_KEY not set in environment')
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials not set')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Calculate date range: today to today + 30 days
const from = new Date()
from.setUTCHours(0, 0, 0, 0)

const to = new Date(from)
to.setUTCDate(to.getUTCDate() + 30)

const fromStr = from.toISOString().split('T')[0] // YYYY-MM-DD
const toStr = to.toISOString().split('T')[0]

console.log(`[FMP Sync] Fetching economic events from ${fromStr} to ${toStr}`)
console.log(`[FMP Sync] Using API Key: ${FMP_API_KEY.substring(0, 10)}...`)

// Fetch from FMP API
async function fetchFromFMP() {
  const url = new URL('https://financialmodelingprep.com/api/v3/economic-calendar')
  url.searchParams.append('apikey', FMP_API_KEY)
  url.searchParams.append('from', fromStr)
  url.searchParams.append('to', toStr)

  console.log(`[FMP Sync] Requesting: ${url.toString().replace(FMP_API_KEY, '***')}`)

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`FMP API returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`[FMP Sync] Received ${Array.isArray(data) ? data.length : 0} events from FMP`)

  if (!Array.isArray(data)) {
    console.error('[FMP Sync] Unexpected response format:', data)
    throw new Error('FMP API returned unexpected format')
  }

  return data
}

// Map FMP event to database schema
function mapFMPEvent(event) {
  const dateTimeStr = `${event.date}T${event.time || '08:30'}:00Z`
  const eventTime = new Date(dateTimeStr)

  // Generate unique ID
  const uniqueId = Math.random().toString(36).substring(2, 15)

  return {
    id: uniqueId,
    event_name: event.event || 'Unknown Event',
    currency: 'USD', // FMP is primarily US data
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
}

function mapImpact(impact) {
  if (!impact) return 'low'
  const lower = impact.toLowerCase()
  if (lower.includes('high')) return 'high'
  if (lower.includes('medium')) return 'medium'
  return 'low'
}

// Main execution
async function main() {
  try {
    // Fetch from FMP
    const rawEvents = await fetchFromFMP()

    // Filter for high-impact events (CPI, NFP, ISM for major currencies)
    const majorIndicators = ['CPI', 'NFP', 'ISM', 'unemployment', 'inflation', 'manufacturing', 'ADP', 'initial jobless', 'retail sales', 'housing starts', 'building permits', 'PMI', 'confidence']
    const majorCountries = ['USA', 'UK', 'EUR', 'Japan', 'China', 'Canada', 'Australia', 'Switzerland', 'Sweden', 'Mexico', 'New Zealand']

    const filteredEvents = rawEvents.filter(event => {
      const eventName = (event.event || '').toUpperCase()
      const country = (event.country || '').toUpperCase()

      // Include if it's a major indicator OR from a major country
      const isMajorIndicator = majorIndicators.some(ind => eventName.includes(ind.toUpperCase()))
      const isMajorCountry = majorCountries.some(c => country.includes(c))

      return isMajorIndicator || isMajorCountry
    })

    console.log(`[FMP Sync] Filtered to ${filteredEvents.length} high-impact events for major pairs`)

    // Map to database format
    const events = filteredEvents.map(mapFMPEvent)

    // Group by indicator for logging
    const byIndicator = {}
    events.forEach(e => {
      const indicator = e.event_name.split('-')[0].trim()
      byIndicator[indicator] = (byIndicator[indicator] || 0) + 1
    })

    console.log(`[FMP Sync] Events by indicator:`)
    Object.entries(byIndicator)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([indicator, count]) => {
        console.log(`  - ${indicator}: ${count} events`)
      })

    // Upsert into database
    console.log(`[FMP Sync] Upserting ${events.length} events to database...`)

    // Batch insert to avoid timeout
    const batchSize = 50
    let totalUpserted = 0

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)
      console.log(`[FMP Sync] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)}...`)

      const { data: upserted, error: upsertError } = await supabase
        .from('economic_events')
        .upsert(batch, {
          onConflict: 'source, source_id, event_time_utc',
          ignoreDuplicates: false,
        })
        .select()

      if (upsertError) {
        console.error('[FMP Sync] Database error on batch:', upsertError)
        throw upsertError
      }

      totalUpserted += upserted?.length || 0
    }

    console.log(`[FMP Sync] ✓ Successfully saved ${totalUpserted} events to database`)

    // Summary
    console.log('\n[FMP Sync] Summary:')
    console.log(`  - Total events fetched: ${rawEvents.length}`)
    console.log(`  - High-impact events: ${events.length}`)
    console.log(`  - Successfully saved: ${totalUpserted}`)
    console.log(`  - Date range: ${fromStr} to ${toStr}`)

    // Verify by querying back
    const { count } = await supabase
      .from('economic_events')
      .select('*', { count: 'exact' })
      .eq('source', 'fmp')

    console.log(`  - Total FMP events in database: ${count}`)

    process.exit(0)
  } catch (error) {
    console.error('[FMP Sync] Fatal error:', error.message || error)
    process.exit(1)
  }
}

main()
