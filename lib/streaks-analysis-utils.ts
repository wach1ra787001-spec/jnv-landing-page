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
  followed_plan?: boolean | null
  discipline_rating?: number | null
  mistakes?: string | null
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function getPnl(trade: StreakTrade): number {
  const value = trade.net_pnl ?? trade.pnl
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function getClosedTradesChronological(trades: StreakTrade[]): StreakTrade[] {
  return trades
    .filter(t => (t.exit_time || t.entry_time) && (t.status ? t.status.toLowerCase() === 'closed' : true) && (t.net_pnl != null || t.pnl != null))
    .sort((a, b) => new Date((a.exit_time || a.entry_time) as string).getTime() - new Date((b.exit_time || b.entry_time) as string).getTime())
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

// ---------------------------------------------------------------------------
// Discipline Tracker
// ---------------------------------------------------------------------------

export interface DisciplineDayEntry {
  date: string // yyyy-mm-dd
  adherencePct: number | null // null = no journaled trades that day
  tradeCount: number
  journaledCount: number
  hardViolation: boolean
  rollingAdherencePct: number | null
}

export interface DisciplineTrackerResult {
  calendarWeeks: (DisciplineDayEntry | null)[][] // columns of weeks, 7 rows each (Sun-Sat); null = out of range padding
  rollingSeries: DisciplineDayEntry[] // sparse, one entry per journaled trading day, in order
  avgAdherencePct: number | null
  totalHardViolations: number
  journaledDays: number
  totalTradingDays: number
}

function toDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

/** Per-trade discipline score 0-100, or null if no journal signal exists. */
function tradeDisciplineScore(t: StreakTrade): number | null {
  if (typeof t.discipline_rating === 'number') {
    return Math.max(0, Math.min(100, (t.discipline_rating / 10) * 100))
  }
  if (typeof t.followed_plan === 'boolean') {
    return t.followed_plan ? 100 : 0
  }
  return null
}

export function computeDisciplineTracker(rawTrades: StreakTrade[], rollingWindow = 7): DisciplineTrackerResult {
  const trades = rawTrades.filter(t => t.entry_time)

  const byDate = new Map<string, StreakTrade[]>()
  for (const t of trades) {
    const key = toDateKey(t.entry_time as string)
    const arr = byDate.get(key)
    if (arr) arr.push(t)
    else byDate.set(key, [t])
  }

  if (byDate.size === 0) {
    return {
      calendarWeeks: [],
      rollingSeries: [],
      avgAdherencePct: null,
      totalHardViolations: 0,
      journaledDays: 0,
      totalTradingDays: 0,
    }
  }

  const sortedDates = Array.from(byDate.keys()).sort()
  const lastDate = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00Z')
  const firstTradeDate = new Date(sortedDates[0] + 'T00:00:00Z')

  // Cap the heatmap to the most recent ~26 weeks so it stays readable, but
  // never extend past the actual trading history.
  const maxRangeStart = new Date(lastDate)
  maxRangeStart.setUTCDate(maxRangeStart.getUTCDate() - 25 * 7)
  const rangeStart = firstTradeDate > maxRangeStart ? firstTradeDate : maxRangeStart

  // Align the grid to full weeks (Sunday start).
  const gridStart = new Date(rangeStart)
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay())
  const gridEnd = new Date(lastDate)
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()))

  const dayEntries: DisciplineDayEntry[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const key = cursor.toISOString().slice(0, 10)
    const dayTrades = byDate.get(key) ?? []
    const scores = dayTrades.map(tradeDisciplineScore).filter((s): s is number => s !== null)
    const hardViolation = dayTrades.some(t => t.followed_plan === false)
    dayEntries.push({
      date: key,
      adherencePct: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      tradeCount: dayTrades.length,
      journaledCount: scores.length,
      hardViolation,
      rollingAdherencePct: null,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  // Rolling adherence computed only across journaled trading days, so the
  // trend line isn't diluted by days without journal entries.
  const journaledDayEntries = dayEntries.filter(d => d.adherencePct !== null)
  const rollingSeries: DisciplineDayEntry[] = journaledDayEntries.map((d, i) => {
    const start = Math.max(0, i - rollingWindow + 1)
    const window = journaledDayEntries.slice(start, i + 1)
    const avg = window.reduce((sum, w) => sum + (w.adherencePct as number), 0) / window.length
    return { ...d, rollingAdherencePct: avg }
  })

  // Stitch the rolling value back onto the dense day entries for the heatmap
  // tooltip / detail view.
  const rollingByDate = new Map(rollingSeries.map(d => [d.date, d.rollingAdherencePct]))
  for (const d of dayEntries) {
    if (rollingByDate.has(d.date)) d.rollingAdherencePct = rollingByDate.get(d.date) ?? null
  }

  // Chunk into 7-day columns (weeks) for the calendar grid.
  const calendarWeeks: (DisciplineDayEntry | null)[][] = []
  for (let i = 0; i < dayEntries.length; i += 7) {
    calendarWeeks.push(dayEntries.slice(i, i + 7))
  }

  const totalHardViolations = dayEntries.filter(d => d.hardViolation).length
  const journaledDays = journaledDayEntries.length
  const avgAdherencePct =
    journaledDays > 0
      ? journaledDayEntries.reduce((sum, d) => sum + (d.adherencePct as number), 0) / journaledDays
      : null

  return {
    calendarWeeks,
    rollingSeries,
    avgAdherencePct,
    totalHardViolations,
    journaledDays,
    totalTradingDays: byDate.size,
  }
}

// ---------------------------------------------------------------------------
// Recovery Patterns
// ---------------------------------------------------------------------------

export interface RecoveryCurvePoint {
  step: number
  avg: number
  p25: number
  p75: number
  bandHeight: number
  n: number
}

export interface RecoveryTimeBucket {
  bucket: string
  count: number
}

export interface RecoveryPatternsResult {
  curve: RecoveryCurvePoint[]
  timeToRecovery: RecoveryTimeBucket[]
  avgTimeToRecovery: number | null
  recoveredCount: number
  unrecoveredCount: number
  totalLossStreaksAnalyzed: number
  minStreakLengthUsed: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export function computeRecoveryPatterns(
  rawTrades: StreakTrade[],
  options?: { minStreakLength?: number; maxHorizon?: number }
): RecoveryPatternsResult {
  const maxHorizon = options?.maxHorizon ?? 15
  const { sequence, streaks } = computeWinLossStreaks(rawTrades)

  const lossStreaks = streaks.filter(s => s.type === 'loss')
  const preferredMin = options?.minStreakLength ?? 2
  const minStreakLengthUsed =
    lossStreaks.some(s => s.length >= preferredMin) ? preferredMin : 1
  const eligibleStreaks = lossStreaks.filter(s => s.length >= minStreakLengthUsed)

  interface Path {
    path: number[]
    recoveredAtStep: number | null
  }

  const paths: Path[] = []

  for (const streak of eligibleStreaks) {
    const future = sequence.slice(streak.endIndex + 1, streak.endIndex + 1 + maxHorizon)
    if (future.length === 0) continue // censored: streak sits at the very end of history

    let cumulative = 0
    let recoveredAtStep: number | null = null
    const path: number[] = []
    future.forEach((entry, i) => {
      cumulative += entry.pnl
      path.push(cumulative)
      if (recoveredAtStep === null && cumulative >= 0) recoveredAtStep = i + 1
    })
    paths.push({ path, recoveredAtStep })
  }

  const curve: RecoveryCurvePoint[] = []
  for (let step = 0; step < maxHorizon; step++) {
    const valuesAtStep = paths.filter(p => p.path.length > step).map(p => p.path[step])
    if (valuesAtStep.length === 0) break
    const sorted = [...valuesAtStep].sort((a, b) => a - b)
    const avg = valuesAtStep.reduce((a, b) => a + b, 0) / valuesAtStep.length
    const p25 = percentile(sorted, 0.25)
    const p75 = percentile(sorted, 0.75)
    curve.push({ step: step + 1, avg, p25, p75, bandHeight: p75 - p25, n: valuesAtStep.length })
  }

  const recoveredTimes = paths
    .map(p => p.recoveredAtStep)
    .filter((v): v is number => v !== null)

  const bucketLabels = ['1', '2', '3', '4', '5+']
  const timeToRecovery: RecoveryTimeBucket[] = bucketLabels.map(label => ({ bucket: label, count: 0 }))
  const bucketFor = (length: number) => (length >= 5 ? '5+' : String(length))
  for (const t of recoveredTimes) {
    const bucket = timeToRecovery.find(b => b.bucket === bucketFor(t))
    if (bucket) bucket.count += 1
  }

  const avgTimeToRecovery =
    recoveredTimes.length > 0 ? recoveredTimes.reduce((a, b) => a + b, 0) / recoveredTimes.length : null

  return {
    curve,
    timeToRecovery,
    avgTimeToRecovery,
    recoveredCount: recoveredTimes.length,
    unrecoveredCount: paths.length - recoveredTimes.length,
    totalLossStreaksAnalyzed: paths.length,
    minStreakLengthUsed,
  }
}
