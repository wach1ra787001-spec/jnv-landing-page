#!/usr/bin/env node

const apiKey = process.env.DATABENTO_API_KEY
const baseUrl = 'https://hist.databento.com/v0'

if (!apiKey) {
  console.error('DATABENTO_API_KEY is not available to this process.')
  process.exit(2)
}

const auth = Buffer.from(`${apiKey}:`).toString('base64')
const headers = {
  Authorization: `Basic ${auth}`,
  Accept: 'application/json',
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  })
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text.slice(0, 500)
  }
  if (!response.ok) {
    const message = typeof body === 'string' ? body : JSON.stringify(body)
    throw new Error(`${response.status} ${response.statusText}: ${message}`)
  }
  return body
}

const result = {
  checkedAt: new Date().toISOString(),
  authentication: 'unknown',
  datasets: [],
  coverageChecks: [],
  limitations: [
    'Databento provides exchange-traded market data; CFD symbols such as US30, NAS100, and SPX500 may not exist as literal symbols.',
    'Forex spot and some CFD-like instruments require a mapped exchange-traded proxy or a separate licensed venue.',
    'Historical data availability and licensing depend on the selected dataset and subscription plan.',
  ],
}

try {
  const datasets = await request('/metadata.list_datasets')
  result.authentication = 'valid'
  result.datasets = Array.isArray(datasets) ? datasets : datasets?.datasets ?? datasets
} catch (error) {
  result.authentication = 'failed'
  result.error = error instanceof Error ? error.message : String(error)
  console.log(JSON.stringify(result, null, 2))
  process.exit(1)
}

const checks = [
  { name: 'Forex', datasetCandidates: ['GLBX.MDP3', 'DBEQ.BASIC'], symbols: ['EURUSD', '6E.FUT'] },
  { name: 'Gold', datasetCandidates: ['GLBX.MDP3'], symbols: ['GC.FUT', 'MGC.FUT'] },
  { name: 'Nasdaq', datasetCandidates: ['GLBX.MDP3'], symbols: ['NQ.FUT', 'MNQ.FUT'] },
  { name: 'Dow', datasetCandidates: ['GLBX.MDP3'], symbols: ['YM.FUT', 'MYM.FUT'] },
  { name: 'S&P 500', datasetCandidates: ['GLBX.MDP3'], symbols: ['ES.FUT', 'MES.FUT'] },
]

for (const check of checks) {
  const coverage = { ...check, status: 'not-tested', matches: [] }
  for (const dataset of check.datasetCandidates) {
    for (const symbol of check.symbols) {
      try {
        const params = new URLSearchParams({
          dataset,
          symbols: symbol,
          schema: 'ohlcv-1m',
          start: '2026-08-17T00:00:00Z',
          end: '2026-08-18T00:00:00Z',
          encoding: 'json',
        })
        const data = await request(`/timeseries.get_range?${params}`)
        const rows = Array.isArray(data) ? data : data?.data ?? []
        coverage.status = 'available'
        coverage.matches.push({ dataset, symbol, rows: rows.length, sample: rows[0] ?? null })
      } catch (error) {
        coverage.matches.push({ dataset, symbol, status: 'unavailable', reason: error instanceof Error ? error.message : String(error) })
      }
    }
  }
  if (coverage.status === 'not-tested') coverage.status = 'unavailable'
  result.coverageChecks.push(coverage)
}

console.log(JSON.stringify(result, null, 2))
