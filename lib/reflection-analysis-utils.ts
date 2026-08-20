export interface ReflectionTrade {
  id: string
  entry_time: string | null
  exit_time?: string | null
  pnl?: number | null
  r_multiple?: number | null
  notes?: string | null
  setup_type?: string | null
  symbol?: string | null
  status?: string | null
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function getPnl(trade: ReflectionTrade): number | null {
  return typeof trade.pnl === 'number' ? trade.pnl : null
}

function getClosedTradesChronological(trades: ReflectionTrade[]): ReflectionTrade[] {
  return trades
    .filter(t => t.entry_time && (t.pnl != null || t.r_multiple != null))
    .sort((a, b) => new Date(a.entry_time as string).getTime() - new Date(b.entry_time as string).getTime())
}

function isJournaled(trade: ReflectionTrade): boolean {
  return typeof trade.notes === 'string' && trade.notes.trim().length > 0
}

function isWin(trade: ReflectionTrade): boolean {
  const pnl = getPnl(trade)
  if (pnl != null) return pnl > 0
  return typeof trade.r_multiple === 'number' && trade.r_multiple > 0
}

function isLoss(trade: ReflectionTrade): boolean {
  const pnl = getPnl(trade)
  if (pnl != null) return pnl < 0
  return typeof trade.r_multiple === 'number' && trade.r_multiple < 0
}

export function wordCount(note: string | null | undefined): number {
  if (!note) return 0
  return note.trim().split(/\s+/).filter(Boolean).length
}

/** Confidence tier for small-sample honesty guardrails. */
export type ConfidenceLevel = 'insufficient' | 'muted' | 'normal'

export function getConfidenceLevel(n: number): ConfidenceLevel {
  if (n < 8) return 'insufficient'
  if (n < 20) return 'muted'
  return 'normal'
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

// ---------------------------------------------------------------------------
// Win / Loss Journal Effect
// ---------------------------------------------------------------------------

export interface JournalEffectPoint {
  tradeId: string
  date: string
  rMultiple: number | null
  pnl: number | null
  isWin: boolean
  setup: string | null
}

export interface JournalEffectResult {
  metric: 'nextTradeR' | 'recoveryTradeR'
  journaled: JournalEffectPoint[]
  notJournaled: JournalEffectPoint[]
  journaledMean: number | null
  notJournaledMean: number | null
  journaledWinRate: number | null
  notJournaledWinRate: number | null
  totalTrades: number
}

function computeConditionEffect(
  rawTrades: ReflectionTrade[],
  condition: (t: ReflectionTrade) => boolean,
  metric: 'nextTradeR' | 'recoveryTradeR'
): JournalEffectResult {
  const trades = getClosedTradesChronological(rawTrades)

  const journaled: JournalEffectPoint[] = []
  const notJournaled: JournalEffectPoint[] = []

  for (let i = 0; i < trades.length - 1; i++) {
    const current = trades[i]
    if (!condition(current)) continue

    const next = trades[i + 1]
    const point: JournalEffectPoint = {
      tradeId: next.id,
      date: next.entry_time as string,
      rMultiple: typeof next.r_multiple === 'number' ? next.r_multiple : null,
      pnl: getPnl(next),
      isWin: isWin(next),
      setup: next.setup_type ?? null,
    }

    if (isJournaled(current)) journaled.push(point)
    else notJournaled.push(point)
  }

  const journaledValues = journaled.map(p => p.rMultiple).filter((v): v is number => v != null)
  const notJournaledValues = notJournaled.map(p => p.rMultiple).filter((v): v is number => v != null)

  const journaledWins = journaled.filter(p => p.isWin).length
  const notJournaledWins = notJournaled.filter(p => p.isWin).length

  return {
    metric,
    journaled,
    notJournaled,
    journaledMean: mean(journaledValues),
    notJournaledMean: mean(notJournaledValues),
    journaledWinRate: journaled.length > 0 ? (journaledWins / journaled.length) * 100 : null,
    notJournaledWinRate: notJournaled.length > 0 ? (notJournaledWins / notJournaled.length) * 100 : null,
    totalTrades: journaled.length + notJournaled.length,
  }
}

export function computeWinJournalEffect(rawTrades: ReflectionTrade[]): JournalEffectResult {
  return computeConditionEffect(rawTrades, isWin, 'nextTradeR')
}

export function computeLossJournalEffect(rawTrades: ReflectionTrade[]): JournalEffectResult {
  return computeConditionEffect(rawTrades, isLoss, 'recoveryTradeR')
}

// ---------------------------------------------------------------------------
// Note Correlation
// ---------------------------------------------------------------------------

export interface NoteCorrelationTrade {
  tradeId: string
  date: string
  noteWordCount: number
  noteDetailScore: number
  rMultiple: number
  setup: string | null
  noteExcerpt: string
}

export interface NoteCorrelationBin {
  label: 'Minimal' | 'Moderate' | 'Detailed'
  range: [number, number]
  avgR: number | null
  count: number
}

export interface NoteCorrelationResult {
  trades: NoteCorrelationTrade[]
  correlation: { method: 'pearson'; r: number | null; n: number }
  bins: NoteCorrelationBin[]
}

function pearsonCorrelation(points: { x: number; y: number }[]): number | null {
  const n = points.length
  if (n < 2) return null

  const meanX = points.reduce((a, p) => a + p.x, 0) / n
  const meanY = points.reduce((a, p) => a + p.y, 0) / n

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (const p of points) {
    const dx = p.x - meanX
    const dy = p.y - meanY
    numerator += dx * dy
    sumSqX += dx * dx
    sumSqY += dy * dy
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)
  if (denominator === 0) return null
  return numerator / denominator
}

export function computeNoteCorrelation(rawTrades: ReflectionTrade[]): NoteCorrelationResult {
  const eligible = rawTrades.filter(t => typeof t.r_multiple === 'number' && t.entry_time)

  const maxWordCount = Math.max(1, ...eligible.map(t => wordCount(t.notes)))

  const trades: NoteCorrelationTrade[] = eligible.map(t => {
    const words = wordCount(t.notes)
    return {
      tradeId: t.id,
      date: t.entry_time as string,
      noteWordCount: words,
      noteDetailScore: Math.min(100, Math.round((words / maxWordCount) * 100)),
      rMultiple: t.r_multiple as number,
      setup: t.setup_type ?? null,
      noteExcerpt: (t.notes ?? '').trim().slice(0, 140),
    }
  })

  const r = pearsonCorrelation(trades.map(t => ({ x: t.noteDetailScore, y: t.rMultiple })))

  const binDefs: { label: NoteCorrelationBin['label']; range: [number, number] }[] = [
    { label: 'Minimal', range: [0, 33] },
    { label: 'Moderate', range: [34, 66] },
    { label: 'Detailed', range: [67, 100] },
  ]

  const bins: NoteCorrelationBin[] = binDefs.map(def => {
    const inBin = trades.filter(t => t.noteDetailScore >= def.range[0] && t.noteDetailScore <= def.range[1])
    return {
      label: def.label,
      range: def.range,
      avgR: mean(inBin.map(t => t.rMultiple)),
      count: inBin.length,
    }
  })

  return {
    trades,
    correlation: { method: 'pearson', r, n: trades.length },
    bins,
  }
}
