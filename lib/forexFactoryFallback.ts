import { EconomicEvent } from '@/types/economic'

/**
 * ForexFactory RSS Fallback Parser
 * Used when TradingEconomics API is unavailable
 * Parses: https://nfs.faireconomy.media/ff_calendar_thisweek.xml
 */

export async function fetchFromForexFactory(): Promise<EconomicEvent[]> {
  try {
    const res = await fetch(
      'https://nfs.faireconomy.media/ff_calendar_thisweek.xml',
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!res.ok) throw new Error(`ForexFactory fetch failed: ${res.statusText}`)

    const xml = await res.text()

    // Simple XML parsing (ForexFactory returns well-formed XML)
    // For production, consider using 'fast-xml-parser' package
    const events: EconomicEvent[] = []

    // Parse event items from RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1]

      // Extract fields
      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemXml)
      const dateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml)
      const descriptionMatch = /<description>([\s\S]*?)<\/description>/.exec(itemXml)
      const countryMatch = /<category>([\s\S]*?)<\/category>/.exec(itemXml)

      if (!titleMatch || !dateMatch) continue

      const title = titleMatch[1].trim()
      const dateStr = dateMatch[1].trim()
      const description = descriptionMatch ? descriptionMatch[1].trim() : ''
      const country = countryMatch ? countryMatch[1].trim() : ''

      // Parse impact level from description or title
      const impact = mapFFImpact(description || title)

      // Extract currency from title or use from country
      const currency = extractCurrency(title) || 'USD'

      // Parse date
      const eventDate = new Date(dateStr)
      if (isNaN(eventDate.getTime())) continue

      events.push({
        id: crypto.randomUUID(),
        event_name: title,
        currency,
        impact,
        event_time_utc: eventDate.toISOString(),
        forecast: null,
        actual: null,
        previous: null,
        revised: null,
        surprise_pct: null,
        source: 'forexfactory',
        source_id: `ff_${title}_${eventDate.getTime()}`,
        country,
        is_released: false,
        is_revised: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    console.log(`[ForexFactory] Parsed ${events.length} events`)
    return events
  } catch (error) {
    console.error('[ForexFactory] Parse error:', error)
    return []
  }
}

function mapFFImpact(text: string): 'high' | 'medium' | 'low' | 'holiday' {
  const lower = text.toLowerCase()

  if (lower.includes('holiday')) return 'holiday'
  if (lower.includes('high')) return 'high'
  if (lower.includes('medium') || lower.includes('moderate')) return 'medium'

  return 'low'
}

function extractCurrency(text: string): string | null {
  const currencyMatch = /\b(USD|EUR|GBP|JPY|CAD|AUD|NZD|CHF|CNY|SEK|NOK)\b/.exec(
    text.toUpperCase()
  )
  return currencyMatch ? currencyMatch[1] : null
}
