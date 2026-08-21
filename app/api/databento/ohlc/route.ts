import { NextRequest, NextResponse } from 'next/server'
import { normalizeMarketSymbol, resolveMarketDataInstrument } from '@/lib/market-data/instruments'

const DEFAULT_SYMBOL = 'EURUSD'
const DEFAULT_SCHEMA = 'ohlcv-1m'
const DEFAULT_LIMIT = 500

function toUnixSeconds(value: string | null, fallback: number) {
  if (!value) return fallback
  const numeric = Number(value)
  if (Number.isFinite(numeric)) return numeric > 10_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric)
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : fallback
}

function parseRecords(payload: string) {
  const rows = payload.trim().split(/\r?\n/).filter(Boolean)
  if (!rows.length) return []
  const headers = rows[0].split(',').map((header) => header.trim().toLowerCase())
  return rows.slice(1).map((row) => {
    const values = row.split(',')
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]))
  })
}

// With pretty_ts=true, Databento's CSV encoding returns ISO-8601 timestamps
// (e.g. "2024-06-01T13:45:00.000000000Z") instead of raw nanosecond integers,
// and with pretty_px=true it returns plain decimal prices instead of
// fixed-point integers scaled by 1e-9. Parsing those raw values without the
// pretty flags is what previously produced billion-scale prices and
// epoch-1970 dates.
function parseTimestamp(value: string | undefined) {
  if (!value) return null
  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    if (numeric > 1e17) return Math.floor(numeric / 1e9)
    if (numeric > 1e14) return Math.floor(numeric / 1e6)
    if (numeric > 1e11) return Math.floor(numeric / 1e3)
    return Math.floor(numeric)
  }
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null
}

function normalizeRecord(record: Record<string, string>) {
  const time = parseTimestamp(record.ts_event ?? record.ts_recv ?? record.timestamp)
  if (!time || time <= 0) return null
  const open = Number(record.open)
  const high = Number(record.high)
  const low = Number(record.low)
  const close = Number(record.close)
  const volume = Number(record.volume ?? 0)
  if (![time, open, high, low, close, volume].every(Number.isFinite) || time <= 0) return null
  if (high < Math.max(open, close) || low > Math.min(open, close) || high < low) return null
  return { time, open, high, low, close, volume }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const apiKey = process.env.DATABENTO_API_KEY?.trim()
  const config = {
    hasDatabentoApiKey: Boolean(apiKey),
    runtime: process.env.VERCEL_ENV ?? 'local',
  }
  console.log('[v0] Databento request start', { requestId, path: request.nextUrl.pathname, ...config })
  if (!apiKey) {
    console.error('[v0] Databento configuration missing', { requestId, ...config })
    return NextResponse.json({
      error: 'Databento is not configured in this deployment',
      code: 'DATABENTO_API_KEY_MISSING',
      requestId,
      ...config,
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const params = request.nextUrl.searchParams
  const symbol = normalizeMarketSymbol(params.get('symbol') || DEFAULT_SYMBOL)
  const instrument = await resolveMarketDataInstrument(symbol)
  if (!instrument) {
    return NextResponse.json({
      error: `No Databento mapping is configured for ${symbol}`,
      code: 'INSTRUMENT_MAPPING_MISSING',
      symbol,
      requestId,
    }, { status: 422, headers: { 'Cache-Control': 'no-store' } })
  }
  const dataset = instrument.dataset
  const providerSymbol = instrument.provider_symbol
  const providerStypeIn = instrument.provider_stype_in
  const schema = params.get('schema') || instrument.schema || DEFAULT_SCHEMA
  // Historical datasets trail wall-clock time. Keep the default and explicit
  // end inside the currently available range instead of sending `now`, which
  // Databento rejects while the latest bars are still being published.
  // CME historical availability can trail UTC by several hours depending on
  // the session and subscription. Use a conservative buffer so the request
  // does not include the provider's unpublished tail.
  const latestAvailable = Math.floor(Date.now() / 1000) - 12 * 60 * 60
  const requestedEnd = toUnixSeconds(params.get('end'), latestAvailable)
  const end = Math.min(requestedEnd, latestAvailable)
  const requestedStart = toUnixSeconds(params.get('start'), end - 30 * 24 * 60 * 60)
  // A newly created session may have a future, reversed, or provider-unavailable
  // range. Use a valid recent historical window instead of returning zero bars.
  const start = requestedStart < end
    ? requestedStart
    : end - 30 * 24 * 60 * 60
  const limit = Math.min(Math.max(Number(params.get('limit') || DEFAULT_LIMIT), 1), 5_000)

  const url = new URL('https://hist.databento.com/v0/timeseries.get_range')
  url.searchParams.set('dataset', dataset)
  url.searchParams.set('symbols', providerSymbol)
  url.searchParams.set('stype_in', providerStypeIn)
  url.searchParams.set('schema', schema)
  url.searchParams.set('start', new Date(start * 1000).toISOString())
  url.searchParams.set('end', new Date(end * 1000).toISOString())
  url.searchParams.set('encoding', 'csv')
  url.searchParams.set('pretty_px', 'true')
  url.searchParams.set('pretty_ts', 'true')
  url.searchParams.set('limit', String(limit))

  console.log('[v0] Databento request params', {
    requestId, symbol, providerSymbol, dataset, schema, stypeIn: providerStypeIn,
    start: url.searchParams.get('start'), end: url.searchParams.get('end'), limit,
  })

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      Accept: 'text/csv, application/json',
    },
    cache: 'no-store',
  })

  const body = await response.text()
  console.log('[v0] Databento response received', {
    requestId, ok: response.ok, status: response.status, bytes: body.length,
    contentType: response.headers.get('content-type'),
  })
  if (!response.ok) {
    console.error('[v0] Databento provider error', { requestId, status: response.status, detail: body.slice(0, 500) })
    return NextResponse.json({ error: 'Databento request failed', requestId, status: response.status, detail: body.slice(0, 500) }, { status: 502 })
  }

  const rawRecords = body.trim().startsWith('[') ? JSON.parse(body) : parseRecords(body)
  const normalized = rawRecords.map((record: Record<string, string>) => normalizeRecord(record))
  const bars = normalized.filter(Boolean).sort((a: any, b: any) => a.time - b.time)
  const deduped = bars.filter((bar: any, index: number, list: any[]) => index === 0 || bar.time !== list[index - 1].time)
  console.log('[v0] Databento bars parsed', {
    requestId, rawRecords: rawRecords.length, validBars: bars.length, dedupedBars: deduped.length,
    firstRaw: rawRecords[0] ? { ts_event: rawRecords[0].ts_event, open: rawRecords[0].open, high: rawRecords[0].high, low: rawRecords[0].low, close: rawRecords[0].close } : null,
    firstNormalized: deduped[0] ? { time: deduped[0].time, timeUnit: 'unix-seconds', open: deduped[0].open, high: deduped[0].high, low: deduped[0].low, close: deduped[0].close } : null,
    firstTime: deduped[0]?.time ?? null, lastTime: deduped[deduped.length - 1]?.time ?? null,
  })

  return NextResponse.json({
    provider: 'databento',
    dataset,
    symbol,
    providerSymbol,
    schema,
    start,
    end,
    count: deduped.length,
    bars: deduped,
  })
}
