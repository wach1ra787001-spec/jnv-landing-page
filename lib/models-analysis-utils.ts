export interface ModelTrade {
  id: string
  entry_time: string | null
  exit_time?: string | null
  pnl?: number | null
  net_pnl?: number | null
  r_multiple?: number | null
  direction?: string | null
  symbol?: string | null
  status?: string | null
  setup_type?: string | null
  strategy?: string | null
}

export const LOW_SAMPLE_THRESHOLD = 10

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function getPnl(trade: ModelTrade): number {
  const value = trade.net_pnl ?? trade.pnl
  return typeof value === 'number' ? value : 0
}

function getSetupName(trade: ModelTrade): string {
  const name = trade.setup_type?.trim() || trade.strategy?.trim()
  return name && name.length > 0 ? name : 'Unspecified'
}

function getClosedTrades(trades: ModelTrade[]): ModelTrade[] {
  return trades.filter(
    t => t.entry_time && (t.status ? t.status.toLowerCase() === 'closed' : true) && (t.net_pnl != null || t.pnl != null)
  )
}

function holdMinutes(t: ModelTrade): number | null {
  if (!t.entry_time || !t.exit_time) return null
  const ms = new Date(t.exit_time).getTime() - new Date(t.entry_time).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null
  return ms / 60000
}

function minMaxNormalize(value: number, min: number, max: number): number {
  if (max - min < 1e-9) return 50
  return ((value - min) / (max - min)) * 100
}

// ---------------------------------------------------------------------------
// 1. Setup Performance (Radar + Scorecard)
// ---------------------------------------------------------------------------

export interface SetupPerformanceRow {
  setupId: string
  name: string
  tradeCount: number
  lowSample: boolean
  raw: {
    winRate: number
    avgR: number
    profitFactor: number
    expectancy: number
    consistency: number
    avgHoldMinutes: number | null
  }
  normalized: {
    winRate: number
    avgR: number
    profitFactor: number
    expectancy: number
    consistency: number
    frequency: number
  }
}

export interface SetupPerformanceResult {
  setups: SetupPerformanceRow[]
}

export function computeSetupPerformance(rawTrades: ModelTrade[]): SetupPerformanceResult {
  const trades = getClosedTrades(rawTrades)
  const bySetup = new Map<string, ModelTrade[]>()
  for (const t of trades) {
    const name = getSetupName(t)
    const arr = bySetup.get(name)
    if (arr) arr.push(t)
    else bySetup.set(name, [t])
  }

  const rows: SetupPerformanceRow[] = []
  for (const [name, setupTrades] of bySetup.entries()) {
    const wins = setupTrades.filter(t => getPnl(t) > 0)
    const losses = setupTrades.filter(t => getPnl(t) < 0)
    const winRate = setupTrades.length > 0 ? (wins.length / setupTrades.length) * 100 : 0

    const rValues = setupTrades.map(t => t.r_multiple).filter((r): r is number => typeof r === 'number')
    const avgR = rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0

    const grossProfit = wins.reduce((sum, t) => sum + getPnl(t), 0)
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + getPnl(t), 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0

    const pnlValues = setupTrades.map(getPnl)
    const expectancy = pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : 0

    // Consistency: inverse of coefficient of variation of PnL (lower spread = higher consistency).
    const meanPnl = expectancy
    const variance =
      pnlValues.length > 1
        ? pnlValues.reduce((sum, v) => sum + (v - meanPnl) ** 2, 0) / (pnlValues.length - 1)
        : 0
    const stdev = Math.sqrt(variance)
    const cov = Math.abs(meanPnl) > 1e-9 ? stdev / Math.abs(meanPnl) : stdev > 0 ? Infinity : 0
    const consistency = Number.isFinite(cov) ? Math.max(0, 100 - cov * 25) : 0

    const holds = setupTrades.map(holdMinutes).filter((h): h is number => h !== null)
    const avgHoldMinutes = holds.length > 0 ? holds.reduce((a, b) => a + b, 0) / holds.length : null

    rows.push({
      setupId: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      tradeCount: setupTrades.length,
      lowSample: setupTrades.length < LOW_SAMPLE_THRESHOLD,
      raw: { winRate, avgR, profitFactor, expectancy, consistency, avgHoldMinutes },
      normalized: { winRate: 0, avgR: 0, profitFactor: 0, expectancy: 0, consistency: 0, frequency: 0 },
    })
  }

  // Min-max normalize each axis across all setups.
  const axisKeys: (keyof SetupPerformanceRow['raw'])[] = ['winRate', 'avgR', 'profitFactor', 'expectancy', 'consistency']
  for (const key of axisKeys) {
    const values = rows.map(r => r.raw[key]).filter((v): v is number => typeof v === 'number')
    const min = Math.min(...values, 0)
    const max = Math.max(...values, 0)
    for (const r of rows) {
      const v = r.raw[key]
      ;(r.normalized as any)[key] = typeof v === 'number' ? minMaxNormalize(v, min, max) : 0
    }
  }

  const counts = rows.map(r => r.tradeCount)
  const minCount = Math.min(...counts, 0)
  const maxCount = Math.max(...counts, 0)
  for (const r of rows) {
    r.normalized.frequency = minMaxNormalize(r.tradeCount, minCount, maxCount)
  }

  rows.sort((a, b) => b.tradeCount - a.tradeCount)

  return { setups: rows }
}

// ---------------------------------------------------------------------------
// 2. Win-Loss Distribution (R-Multiple Histogram)
// ---------------------------------------------------------------------------

export interface RBin {
  rangeLabel: string
  min: number
  max: number | null
  count: number
}

export interface WinLossDistributionResult {
  bins: RBin[]
  meanR: number | null
  medianR: number | null
  skew: 'right' | 'left' | 'balanced' | null
  tradeCount: number
}

const BIN_DEFS: { rangeLabel: string; min: number; max: number | null }[] = [
  { rangeLabel: '-3R to -2R', min: -3, max: -2 },
  { rangeLabel: '-2R to -1R', min: -2, max: -1 },
  { rangeLabel: '-1R to 0R', min: -1, max: 0 },
  { rangeLabel: '0R to 1R', min: 0, max: 1 },
  { rangeLabel: '1R to 2R', min: 1, max: 2 },
  { rangeLabel: '2R+', min: 2, max: null },
]

export function computeWinLossDistribution(rawTrades: ModelTrade[], setupFilter?: string | null): WinLossDistributionResult {
  const trades = getClosedTrades(rawTrades).filter(t => (setupFilter ? getSetupName(t) === setupFilter : true))
  const rValues = trades.map(t => t.r_multiple).filter((r): r is number => typeof r === 'number')

  const bins: RBin[] = BIN_DEFS.map(def => ({ ...def, count: 0 }))
  for (const r of rValues) {
    const clamped = Math.max(-3, Math.min(r, 2.999))
    const bin =
      bins.find(b => (b.max === null ? clamped >= b.min : clamped >= b.min && clamped < b.max)) ?? bins[bins.length - 1]
    bin.count += 1
  }

  if (rValues.length === 0) {
    return { bins, meanR: null, medianR: null, skew: null, tradeCount: 0 }
  }

  const sorted = [...rValues].sort((a, b) => a - b)
  const meanR = rValues.reduce((a, b) => a + b, 0) / rValues.length
  const mid = Math.floor(sorted.length / 2)
  const medianR = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

  const diff = meanR - medianR
  const skew: WinLossDistributionResult['skew'] = diff > 0.1 ? 'right' : diff < -0.1 ? 'left' : 'balanced'

  return { bins, meanR, medianR, skew, tradeCount: rValues.length }
}

export function getAvailableSetupNames(rawTrades: ModelTrade[]): string[] {
  const trades = getClosedTrades(rawTrades)
  const names = new Set(trades.map(getSetupName))
  return Array.from(names).sort()
}

// ---------------------------------------------------------------------------
// 3. Bias Effects (Setup x Direction Heatmap + Scatter)
// ---------------------------------------------------------------------------

export interface DirectionCell {
  winRate: number
  avgR: number
  expectancy: number
  count: number
  lowSample: boolean
}

export interface BiasMatrixRow {
  setupId: string
  name: string
  long: DirectionCell
  short: DirectionCell
}

export interface BiasCorrelationPoint {
  setupId: string
  name: string
  longPct: number
  expectancy: number
  tradeCount: number
  lowSample: boolean
}

export interface BiasEffectsResult {
  matrix: BiasMatrixRow[]
  correlation: BiasCorrelationPoint[]
}

function buildDirectionCell(trades: ModelTrade[]): DirectionCell {
  const wins = trades.filter(t => getPnl(t) > 0).length
  const rValues = trades.map(t => t.r_multiple).filter((r): r is number => typeof r === 'number')
  const pnlValues = trades.map(getPnl)
  return {
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0,
    expectancy: pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : 0,
    count: trades.length,
    lowSample: trades.length < LOW_SAMPLE_THRESHOLD,
  }
}

export function computeBiasEffects(rawTrades: ModelTrade[]): BiasEffectsResult {
  const trades = getClosedTrades(rawTrades).filter(t => t.direction === 'long' || t.direction === 'short')
  const bySetup = new Map<string, ModelTrade[]>()
  for (const t of trades) {
    const name = getSetupName(t)
    const arr = bySetup.get(name)
    if (arr) arr.push(t)
    else bySetup.set(name, [t])
  }

  const matrix: BiasMatrixRow[] = []
  const correlation: BiasCorrelationPoint[] = []

  for (const [name, setupTrades] of bySetup.entries()) {
    const longTrades = setupTrades.filter(t => t.direction === 'long')
    const shortTrades = setupTrades.filter(t => t.direction === 'short')
    const setupId = name.toLowerCase().replace(/\s+/g, '-')

    matrix.push({
      setupId,
      name,
      long: buildDirectionCell(longTrades),
      short: buildDirectionCell(shortTrades),
    })

    const pnlValues = setupTrades.map(getPnl)
    const expectancy = pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : 0

    correlation.push({
      setupId,
      name,
      longPct: setupTrades.length > 0 ? (longTrades.length / setupTrades.length) * 100 : 0,
      expectancy,
      tradeCount: setupTrades.length,
      lowSample: setupTrades.length < LOW_SAMPLE_THRESHOLD,
    })
  }

  matrix.sort((a, b) => b.long.count + b.short.count - (a.long.count + a.short.count))

  return { matrix, correlation }
}

// ---------------------------------------------------------------------------
// 4. Profit Factor Analysis (Ranked Bar + Bubble)
// ---------------------------------------------------------------------------

export interface StrategyProfitRow {
  setupId: string
  name: string
  profitFactor: number
  grossProfit: number
  grossLoss: number
  winRate: number
  netPnl: number
  tradeCount: number
  lowSample: boolean
}

export interface ProfitFactorResult {
  strategies: StrategyProfitRow[]
}

export function computeProfitFactorAnalysis(rawTrades: ModelTrade[]): ProfitFactorResult {
  const trades = getClosedTrades(rawTrades)
  const bySetup = new Map<string, ModelTrade[]>()
  for (const t of trades) {
    const name = getSetupName(t)
    const arr = bySetup.get(name)
    if (arr) arr.push(t)
    else bySetup.set(name, [t])
  }

  const strategies: StrategyProfitRow[] = []
  for (const [name, setupTrades] of bySetup.entries()) {
    const wins = setupTrades.filter(t => getPnl(t) > 0)
    const losses = setupTrades.filter(t => getPnl(t) < 0)
    const grossProfit = wins.reduce((sum, t) => sum + getPnl(t), 0)
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + getPnl(t), 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0
    const netPnl = setupTrades.reduce((sum, t) => sum + getPnl(t), 0)

    strategies.push({
      setupId: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      profitFactor,
      grossProfit,
      grossLoss,
      winRate: setupTrades.length > 0 ? (wins.length / setupTrades.length) * 100 : 0,
      netPnl,
      tradeCount: setupTrades.length,
      lowSample: setupTrades.length < LOW_SAMPLE_THRESHOLD,
    })
  }

  strategies.sort((a, b) => b.profitFactor - a.profitFactor)

  return { strategies }
}
