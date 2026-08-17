export interface StreakTrade {
  id: string
  entry_time: string | null
  exit_time?: string | null
  pnl?: number | null
  net_pnl?: number | null
  r_multiple?: number | null
  direction?: string | null
  symbol?: string | null
  status?: string | null
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function getPnl(trade: StreakTrade): number {
  const value = trade.net_pnl ?? trade.pnl
  return typeof value === 'number' ? value : 0
}

function getClosedTradesChronological(trades: StreakTrade[]): StreakTrade[] {
  return trades
    .filter(t => t.entry_time && (t.status ? t.status === 'closed' : true) && (t.net_pnl != null || t.pnl != null))
    .sort((a, b) => new Date(a.entry_time as string).getTime() - new Date(b.entry_time as string).getTime())
}

// ---------------------------------------------------------------------------
// Directional Bias
// ---------------------------------------------------------------------------

export interface DirectionStats {
  direction: 'long' | 'short'
  trades: number
  wins: number
  winRate: number
  avgR: number
  totalPnl: number
  avgPnl: number
}

export interface BiasDriftPoint {
  index: number
  date: string
  longPct: number
}

export interface DirectionalBiasResult {
  long: DirectionStats
  short: DirectionStats
  biasDrift: BiasDriftPoint[]
  totalTrades: number
}

function buildDirectionStats(direction: 'long' | 'short', trades: StreakTrade[]): DirectionStats {
  const wins = trades.filter(t => getPnl(t) > 0).length
  const rValues = trades.map(t => t.r_multiple).filter((r): r is number => typeof r === 'number')
  const totalPnl = trades.reduce((sum, t) => sum + getPnl(t), 0)

  return {
    direction,
    trades: trades.length,
    wins,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0,
    totalPnl,
    avgPnl: trades.length > 0 ? totalPnl / trades.length : 0,
  }
}

export function computeDirectionalBias(rawTrades: StreakTrade[], rollingWindow = 20): DirectionalBiasResult {
  const trades = getClosedTradesChronological(rawTrades).filter(
    t => t.direction === 'long' || t.direction === 'short'
  )

  const longTrades = trades.filter(t => t.direction === 'long')
  const shortTrades = trades.filter(t => t.direction === 'short')

  // Bias drift: rolling % of trades that were Long, over a moving window.
  const windowSize = Math.min(rollingWindow, Math.max(5, Math.floor(trades.length / 4)) || rollingWindow)
  const biasDriftFull: BiasDriftPoint[] = trades.map((t, i) => {
    const start = Math.max(0, i - windowSize + 1)
    const window = trades.slice(start, i + 1)
    const longCount = window.filter(w => w.direction === 'long').length
    return {
      index: i,
      date: t.entry_time as string,
      longPct: (longCount / window.length) * 100,
    }
  })

  // Downsample for chart readability if there are too many points.
  const maxPoints = 120
  const biasDrift =
    biasDriftFull.length > maxPoints
      ? biasDriftFull.filter((_, i) => i % Math.ceil(biasDriftFull.length / maxPoints) === 0)
      : biasDriftFull

  return {
    long: buildDirectionStats('long', longTrades),
    short: buildDirectionStats('short', shortTrades),
    biasDrift,
    totalTrades: trades.length,
  }
}

// ---------------------------------------------------------------------------
// Win-Loss Streaks
// ---------------------------------------------------------------------------

export type SequenceOutcome = 'win' | 'loss' | 'breakeven'

export interface SequenceEntry {
  index: number
  outcome: SequenceOutcome
  pnl: number
  date: string
  symbol: string | null
  direction: string | null
}

export interface StreakGroup {
  type: SequenceOutcome
  length: number
  startIndex: number
  endIndex: number
  startDate: string
  endDate: string
  totalPnl: number
}

export interface StreakHistogramBucket {
  length: string
  win: number
  loss: number
}

export interface WinLossStreaksResult {
  sequence: SequenceEntry[]
  streaks: StreakGroup[]
  histogram: StreakHistogramBucket[]
  longestWinStreak: number
  longestLossStreak: number
  currentStreak: { type: SequenceOutcome; length: number } | null
  avgWinStreakLength: number
  avgLossStreakLength: number
}

function classifyOutcome(pnl: number): SequenceOutcome {
  if (pnl > 0) return 'win'
  if (pnl < 0) return 'loss'
  return 'breakeven'
}

export function computeWinLossStreaks(rawTrades: StreakTrade[]): WinLossStreaksResult {
  const trades = getClosedTradesChronological(rawTrades)

  const sequence: SequenceEntry[] = trades.map((t, i) => ({
    index: i,
    outcome: classifyOutcome(getPnl(t)),
    pnl: getPnl(t),
    date: t.entry_time as string,
    symbol: t.symbol ?? null,
    direction: t.direction ?? null,
  }))

  const streaks: StreakGroup[] = []
  let current: StreakGroup | null = null

  for (const entry of sequence) {
    if (entry.outcome === 'breakeven') {
      current = null
      streaks.push({
        type: 'breakeven',
        length: 1,
        startIndex: entry.index,
        endIndex: entry.index,
        startDate: entry.date,
        endDate: entry.date,
        totalPnl: entry.pnl,
      })
      continue
    }

    if (current && current.type === entry.outcome) {
      current.length += 1
      current.endIndex = entry.index
      current.endDate = entry.date
      current.totalPnl += entry.pnl
    } else {
      current = {
        type: entry.outcome,
        length: 1,
        startIndex: entry.index,
        endIndex: entry.index,
        startDate: entry.date,
        endDate: entry.date,
        totalPnl: entry.pnl,
      }
      streaks.push(current)
    }
  }

  const winStreaks = streaks.filter(s => s.type === 'win')
  const lossStreaks = streaks.filter(s => s.type === 'loss')

  const longestWinStreak = winStreaks.reduce((max, s) => Math.max(max, s.length), 0)
  const longestLossStreak = lossStreaks.reduce((max, s) => Math.max(max, s.length), 0)

  const avgWinStreakLength =
    winStreaks.length > 0 ? winStreaks.reduce((sum, s) => sum + s.length, 0) / winStreaks.length : 0
  const avgLossStreakLength =
    lossStreaks.length > 0 ? lossStreaks.reduce((sum, s) => sum + s.length, 0) / lossStreaks.length : 0

  const lastGroup = [...streaks].reverse().find(s => s.type !== 'breakeven')
  const currentStreak = lastGroup ? { type: lastGroup.type, length: lastGroup.length } : null

  // Histogram: bucket streak lengths into 1, 2, 3, 4, 5+
  const bucketLabels = ['1', '2', '3', '4', '5+']
  const histogram: StreakHistogramBucket[] = bucketLabels.map(label => ({ length: label, win: 0, loss: 0 }))

  const bucketFor = (length: number) => (length >= 5 ? '5+' : String(length))

  for (const s of winStreaks) {
    const bucket = histogram.find(h => h.length === bucketFor(s.length))
    if (bucket) bucket.win += 1
  }
  for (const s of lossStreaks) {
    const bucket = histogram.find(h => h.length === bucketFor(s.length))
    if (bucket) bucket.loss += 1
  }

  return {
    sequence,
    streaks,
    histogram,
    longestWinStreak,
    longestLossStreak,
    currentStreak,
    avgWinStreakLength,
    avgLossStreakLength,
  }
}
