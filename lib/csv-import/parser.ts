/**
 * CSV Import Engine
 * Broker detection, column mapping, parsing, and validation
 */

// ── Field definitions ─────────────────────────────────────────────────────────

export const FIELD_MAP: Record<string, string[]> = {
  symbol:       ['Symbol', 'Instrument', 'Market', 'Pair', 'Asset'],
  direction:    ['Buy/Sell', 'Buy / Sell', 'Side', 'Type', 'Direction', 'Action', 'Order Type', 'B/S'],
  open_time:    ['Open Time', 'Entry Time', 'Time Open', 'Open Date', 'Entry Date', 'Date/Time', 'Open Date/Time', 'Position Open Time', 'Entry Time (UTC)'],
  close_time:   ['Close Time', 'Exit Time', 'Time Close', 'Close Date', 'Exit Date', 'Close Date/Time', 'Position Close Time', 'Exit Time (UTC)'],
  entry_price:  ['Open Price', 'Entry', 'Price Open', 'Entry Price', 'Open', 'Entry Rate'],
  exit_price:   ['Close Price', 'Exit', 'Price Close', 'Exit Price', 'Close', 'Exit Rate'],
  lot_size:     ['Lots', 'Size', 'Volume', 'Quantity', 'Lot Size', 'Units', 'Amount', 'Contracts'],
  pnl:          ['Profit', 'PnL', 'Net Profit', 'P&L', 'Gross P/L', 'Profit/Loss', 'Realized P&L'],
  commission:   ['Commission', 'Fee', 'Fees', 'Comm'],
  swap:         ['Swap', 'Financing', 'Overnight', 'Rollover'],
  stop_loss:    ['SL', 'Stop Loss', 'Stop', 'S/L'],
  take_profit:  ['TP', 'Take Profit', 'Target', 'T/P'],
  external_ref: ['Position ID', 'Order ID', 'Trade ID', 'Ticket', 'Ref', 'Reference', 'ID', 'Order #'],
  net_pnl:      ['Net P&L', 'Net Profit', 'Net', 'Net PnL'],
}

export type FieldKey = keyof typeof FIELD_MAP

export const REQUIRED_FIELDS: FieldKey[] = ['symbol', 'direction', 'open_time', 'entry_price', 'lot_size']

// ── Broker signatures ─────────────────────────────────────────────────────────

interface BrokerSignature {
  name: string
  requiredHeaders: string[]
  directionMap: Record<string, string>
}

const BROKER_SIGNATURES: BrokerSignature[] = [
  {
    name: 'cTrader',
    requiredHeaders: ['Position ID', 'Symbol', 'Direction', 'Volume', 'Entry Price'],
    directionMap: { 'Buy': 'long', 'Sell': 'short', 'BUY': 'long', 'SELL': 'short' },
  },
  {
    name: 'MetaTrader 4',
    requiredHeaders: ['Ticket', 'Open Time', 'Type', 'Size', 'Item'],
    directionMap: { 'buy': 'long', 'sell': 'short', 'Buy': 'long', 'Sell': 'short' },
  },
  {
    name: 'MetaTrader 5',
    requiredHeaders: ['Position ID', 'Symbol', 'Volume', 'Open Price', 'Close Price'],
    directionMap: { 'buy': 'long', 'sell': 'short', 'Buy': 'long', 'Sell': 'short' },
  },
  {
    name: 'TradingView',
    requiredHeaders: ['Symbol', 'Entry Price', 'Exit Price', 'Profit'],
    directionMap: { 'Long': 'long', 'Short': 'short', 'Buy': 'long', 'Sell': 'short' },
  },
  {
    name: 'Interactive Brokers',
    requiredHeaders: ['Symbol', 'Buy/Sell', 'Quantity', 'TradePrice'],
    directionMap: { 'BUY': 'long', 'SELL': 'short', 'Buy': 'long', 'Sell': 'short' },
  },
  {
    name: 'Tradier',
    requiredHeaders: ['symbol', 'side', 'quantity', 'avg_price'],
    directionMap: { 'buy': 'long', 'sell': 'short', 'buy_to_open': 'long', 'sell_to_close': 'short' },
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ColumnMapping {
  csvHeader: string
  fieldKey: FieldKey | null
}

export interface ParsedTrade {
  symbol: string
  direction: 'long' | 'short'
  entry_price: number
  exit_price: number | null
  lot_size: number
  quantity: number
  open_time: string
  close_time: string | null
  pnl: number
  net_pnl: number
  commission: number
  swap: number
  stop_loss: number | null
  take_profit: number | null
  external_ref: string | null
  status: 'open' | 'closed'
  source: string
  raw: Record<string, string>
}

export interface ParseResult {
  broker: string | null
  headers: string[]
  mapping: ColumnMapping[]
  trades: ParsedTrade[]
  errors: { row: number; message: string }[]
  skipped: number
  rawRows: Record<string, string>[]
}

// ── CSV tokenizer (handles quoted commas) ────────────────────────────────────

function tokenize(line: string): string[] {
  const tokens: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      tokens.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  tokens.push(cur.trim())
  return tokens
}

// ── Broker detection ──────────────────────────────────────────────────────────

export function detectBroker(headers: string[]): string | null {
  const headerSet = new Set(headers.map(h => h.trim()))
  let bestMatch: string | null = null
  let bestScore = 0

  for (const sig of BROKER_SIGNATURES) {
    const matches = sig.requiredHeaders.filter(h => headerSet.has(h)).length
    const score = matches / sig.requiredHeaders.length
    if (score > bestScore && score >= 0.6) {
      bestScore = score
      bestMatch = sig.name
    }
  }
  return bestMatch
}

// ── Auto column mapping ───────────────────────────────────────────────────────

export function autoMapColumns(headers: string[]): ColumnMapping[] {
  return headers.map(csvHeader => {
    const norm = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const [fieldKey, aliases] of Object.entries(FIELD_MAP)) {
      for (const alias of aliases) {
        if (alias.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) {
          return { csvHeader, fieldKey: fieldKey as FieldKey }
        }
      }
    }
    return { csvHeader, fieldKey: null }
  })
}

// ── Direction normalizer ──────────────────────────────────────────────────────

function normalizeDirection(raw: string): 'long' | 'short' {
  const v = raw.toLowerCase().trim()
  if (['buy', 'long', 'b', 'buy_to_open', 'buy to open'].includes(v)) return 'long'
  if (['sell', 'short', 's', 'sell_to_close', 'sell to close'].includes(v)) return 'short'
  return 'long' // default
}

// ── Date parser ───────────────────────────────────────────────────────────────

function parseDate(raw: string): string | null {
  if (!raw || raw === '' || raw === '0' || raw === '-') return null
  // Try ISO, then common formats
  const formats = [
    raw,
    raw.replace(' ', 'T'),
    // DD.MM.YYYY HH:MM:SS
    raw.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1'),
    // DD/MM/YYYY HH:MM:SS
    raw.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'),
  ]
  for (const fmt of formats) {
    const d = new Date(fmt)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

// ── Full parse ────────────────────────────────────────────────────────────────

export function parseCSV(
  text: string,
  userMapping?: ColumnMapping[]
): ParseResult {
  const rawLines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  if (rawLines.length < 2) {
    return { broker: null, headers: [], mapping: [], trades: [], errors: [{ row: 0, message: 'File has no data rows' }], skipped: 0, rawRows: [] }
  }

  const headers = tokenize(rawLines[0])
  const broker = detectBroker(headers)
  const mapping = userMapping ?? autoMapColumns(headers)

  // Build a lookup: fieldKey → csvHeader index
  const fieldIndex: Partial<Record<FieldKey, number>> = {}
  for (const m of mapping) {
    if (m.fieldKey) {
      const idx = headers.indexOf(m.csvHeader)
      if (idx !== -1) fieldIndex[m.fieldKey] = idx
    }
  }

  const get = (row: string[], field: FieldKey): string => {
    const idx = fieldIndex[field]
    return idx !== undefined ? (row[idx] ?? '') : ''
  }

  const trades: ParsedTrade[] = []
  const errors: { row: number; message: string }[] = []
  const rawRows: Record<string, string>[] = []
  let skipped = 0

  for (let i = 1; i < rawLines.length; i++) {
    const rowNum = i + 1
    try {
      const values = tokenize(rawLines[i])
      const rowObj: Record<string, string> = {}
      headers.forEach((h, idx) => { rowObj[h] = values[idx] ?? '' })
      rawRows.push(rowObj)

      const symbol = get(values, 'symbol').toUpperCase().replace(/["']/g, '').trim()
      const dirRaw = get(values, 'direction')
      const entryRaw = get(values, 'entry_price')
      const lotRaw = get(values, 'lot_size')
      const openTimeRaw = get(values, 'open_time')

      // Validate required
      const missing: string[] = []
      if (!symbol) missing.push('symbol')
      if (!dirRaw) missing.push('direction')
      if (!entryRaw) missing.push('entry_price')
      if (!lotRaw) missing.push('lot_size')
      if (!openTimeRaw) missing.push('open_time')

      if (missing.length > 0) {
        errors.push({ row: rowNum, message: `Missing: ${missing.join(', ')}` })
        skipped++
        continue
      }

      const entryPrice = parseFloat(entryRaw)
      const lotSize = parseFloat(lotRaw)
      if (isNaN(entryPrice) || isNaN(lotSize)) {
        errors.push({ row: rowNum, message: 'Invalid number in entry_price or lot_size' })
        skipped++
        continue
      }

      const openTime = parseDate(openTimeRaw)
      if (!openTime) {
        errors.push({ row: rowNum, message: `Cannot parse open_time: "${openTimeRaw}"` })
        skipped++
        continue
      }

      const exitRaw = get(values, 'exit_price')
      const closeTimeRaw = get(values, 'close_time')
      const exitPrice = exitRaw ? parseFloat(exitRaw) : null
      const closeTime = closeTimeRaw ? parseDate(closeTimeRaw) : null
      const isClosed = exitPrice !== null && !isNaN(exitPrice) && closeTime !== null

      const pnlRaw = get(values, 'pnl')
      const netPnlRaw = get(values, 'net_pnl') || pnlRaw
      const commRaw = get(values, 'commission')
      const swapRaw = get(values, 'swap')
      const slRaw = get(values, 'stop_loss')
      const tpRaw = get(values, 'take_profit')
      const refRaw = get(values, 'external_ref')

      const pnl = pnlRaw ? parseFloat(pnlRaw) : 0
      const netPnl = netPnlRaw ? parseFloat(netPnlRaw) : pnl
      const commission = commRaw ? parseFloat(commRaw) : 0
      const swap = swapRaw ? parseFloat(swapRaw) : 0
      const stopLoss = slRaw && slRaw !== '0' ? parseFloat(slRaw) : null
      const takeProfit = tpRaw && tpRaw !== '0' ? parseFloat(tpRaw) : null

      trades.push({
        symbol,
        direction: normalizeDirection(dirRaw),
        entry_price: entryPrice,
        exit_price: isClosed ? exitPrice : null,
        lot_size: lotSize,
        quantity: lotSize,
        open_time: openTime,
        close_time: isClosed ? closeTime : null,
        pnl: isNaN(pnl) ? 0 : pnl,
        net_pnl: isNaN(netPnl) ? 0 : netPnl,
        commission: isNaN(commission) ? 0 : commission,
        swap: isNaN(swap) ? 0 : swap,
        stop_loss: stopLoss && !isNaN(stopLoss) ? stopLoss : null,
        take_profit: takeProfit && !isNaN(takeProfit) ? takeProfit : null,
        external_ref: refRaw || null,
        status: isClosed ? 'closed' : 'open',
        source: broker ? broker.toLowerCase().replace(/\s+/g, '_') : 'csv',
        raw: rowObj,
      })
    } catch (err: any) {
      errors.push({ row: rowNum, message: err.message })
      skipped++
    }
  }

  return { broker, headers, mapping, trades, errors, skipped, rawRows }
}
