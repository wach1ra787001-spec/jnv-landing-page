import { NextRequest, NextResponse } from 'next/server'

const DATASET = 'GLBX.MDP3'
const DEFAULT_SYMBOL = '6E.c.0'
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

function normalizeRecord(record: Record<string, string>) {
  const timestamp = Number(record.ts_event ?? record.ts_recv ?? record.timestamp)
  const divisor = timestamp > 10_000_000_000_000 ? 1_000_000_000 : timestamp > 10_000_000_000 ? 1_000 : 1
  const time = Math.floor(timestamp / divisor)
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
  const apiKey = process.env.DATABENTO_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Databento is not configured' }, { status: 503 })

  const params = request.nextUrl.searchParams
  const symbol = params.get('symbol') || DEFAULT_SYMBOL
  const schema = params.get('schema') || DEFAULT_SCHEMA
  // Historical datasets trail wall-clock time. Keep the default and explicit
  // end inside the currently available range instead of sending `now`, which
  // Databento rejects while the latest bars are still being published.
  // CME historical availability can trail UTC by several hours depending on
  // the session and subscription. Use a conservative buffer so the request
  // does not include the provider's unpublished tail.
  const latestAvailable = Math.floor(Date.now() / 1000) - 12 * 60 * 60
  const requestedEnd = toUnixSeconds(params.get('end'), latestAvailable)
  const end = Math.min(requestedEnd, latestAvailable)
  const start = toUnixSeconds(params.get('start'), end - 30 * 24 * 60 * 60)
  const limit = Math.min(Math.max(Number(params.get('limit') || DEFAULT_LIMIT), 1), 5_000)

  const url = new URL('https://hist.databento.com/v0/timeseries.get_range')
  url.searchParams.set('dataset', DATASET)
  url.searchParams.set('symbols', symbol)
  url.searchParams.set('stype_in', symbol.includes('.') ? 'continuous' : 'raw_symbol')
  url.searchParams.set('schema', schema)
  url.searchParams.set('start', new Date(start * 1000).toISOString())
  url.searchParams.set('end', new Date(end * 1000).toISOString())
  url.searchParams.set('encoding', 'csv')
  url.searchParams.set('limit', String(limit))

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      Accept: 'text/csv, application/json',
    },
    cache: 'no-store',
  })

  const body = await response.text()
  if (!response.ok) {
    return NextResponse.json({ error: 'Databento request failed', status: response.status, detail: body.slice(0, 500) }, { status: 502 })
  }

  const rawRecords = body.trim().startsWith('[') ? JSON.parse(body) : parseRecords(body)
  const bars = rawRecords.map((record: Record<string, string>) => normalizeRecord(record)).filter(Boolean).sort((a: any, b: any) => a.time - b.time)
  const deduped = bars.filter((bar: any, index: number, list: any[]) => index === 0 || bar.time !== list[index - 1].time)

  return NextResponse.json({
    provider: 'databento',
    dataset: DATASET,
    symbol,
    schema,
    start,
    end,
    count: deduped.length,
    bars: deduped,
  })
}
