import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EconomicEvent } from '@/types/economic'
import { hasValidCronSecret } from '@/lib/security/request-guards'

/**
 * GET /api/economic-calendar/update-actuals
 *
 * Updates actual values for recently released events.
 * Runs every 15 minutes during market hours via Vercel Cron.
 * Protected by CRON_SECRET header.
 */

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    if (!hasValidCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Find events in the last 48 hours that haven't been released yet
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000)

    const { data: unreleased, error: fetchError } = await supabase
      .from('economic_events')
      .select('*')
      .eq('is_released', false)
      .gte('event_time_utc', cutoffTime.toISOString())
      .lte('event_time_utc', new Date().toISOString())

    if (fetchError) {
      console.error('[EconomicCalendar] Error fetching unreleased events:', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    if (!unreleased || unreleased.length === 0) {
      console.log('[EconomicCalendar] No unreleased events to update')
      return NextResponse.json({ updated: 0 })
    }

    console.log(`[EconomicCalendar] Checking ${unreleased.length} unreleased events`)

    let updated = 0

    // For each unreleased event, check if actual has been released
    for (const event of unreleased) {
      // If event has actual value but is_released is false, mark as released and calculate surprise
      if (event.actual && !event.is_released) {
        const surprise_pct = calculateSurprise(event.actual, event.forecast)

        const { error: updateError } = await supabase
          .from('economic_events')
          .update({
            is_released: true,
            surprise_pct,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)

        if (updateError) {
          console.error(`[EconomicCalendar] Error updating event ${event.id}:`, updateError)
        } else {
          updated++
          console.log(
            `[EconomicCalendar] Updated ${event.event_name}: actual=${event.actual}, surprise=${surprise_pct?.toFixed(2)}%`
          )
        }
      }
    }

    console.log(`[EconomicCalendar] Update complete: ${updated} events updated`)

    return NextResponse.json({ updated })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[EconomicCalendar] Update error:', errorMsg)

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}

/**
 * Calculate surprise percentage
 * Surprise = (Actual - Forecast) / |Forecast| * 100
 */
function calculateSurprise(actual: string | null, forecast: string | null): number | null {
  if (!actual || !forecast) return null

  try {
    const actualVal = parseFloat(actual)
    const forecastVal = parseFloat(forecast)

    if (isNaN(actualVal) || isNaN(forecastVal) || forecastVal === 0) {
      return null
    }

    return ((actualVal - forecastVal) / Math.abs(forecastVal)) * 100
  } catch {
    return null
  }
}
