/**
 * Day-to-Day Analysis
 * -------------------
 * Computes the data behind the dashboard's daily health-check card, which
 * answers: "How did I trade today, and how is today affecting my overall
 * performance?"
 *
 * Scope on purpose: Results -> Risk -> Discipline -> Insight. This is NOT
 * meant to become another analytics page - keep additions to this file
 * narrow and dashboard-relevant.
 */

import {
  calculateTradeConsistencyScore,
  hasMeaningfulJournalNotes,
  type ConsistencyScoreInputs,
} from './consistency-score'

export interface DayToDayTrade {
  id: string
  exit_time: string | null
  entry_time: string | null
  status: string | null
  net_pnl: number | null
  pnl: number | null
  pnl_percent: number | null
  r_multiple: number | null
  risk_percent: number | null
  risk_amount: number | null
  session: string | null
}

export interface JournalRow {
  trade_id: string
  discipline_rating?: number | null
  followed_plan?: boolean | null
  content?: string | null
  session_notes?: string | null
  pre_trade_notes?: string | null
  post_trade_notes?: string | null
  lessons_learned?: string | null
  mistakes?: string | null
  what_went_well?: string | null
}

export interface SessionBreakdown {
  label: 'London' | 'New York' | 'Asia' | 'Other'
  trades: number
  pnl: number
}

export interface DayToDaySnapshot {
  hasTrades: boolean
  pnlAmount: number
  pnlPercent: number
  totalR: number
  tradesTaken: number
  wins: number
  losses: number
  winRate: number
  avgR: number
  plannedRiskPercent: number
  actualRiskPercent: number
  disciplineScore: number
  dailyDrawdown: number
  currentStreak: { count: number; type: 'win' | 'loss' | 'none' }
  sessions: SessionBreakdown[]
  journalStatus: 'completed' | 'partial' | 'incomplete' | 'no_trades'
  insight: string
}

export interface SevenDayTrendPoint {
  label: string
  pnl: number
  winRate: number
  discipline: number
  hasTrades: boolean
}

function isSameLocalDay(isoDate: string | null | undefined, reference: Date): boolean {
  if (!isoDate) return false
  const d = new Date(isoDate)
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  )
}

function sessionLabel(session: string | null): SessionBreakdown['label'] {
  if (!session) return 'Other'
  if (session.startsWith('London')) return 'London'
  if (session.startsWith('New York')) return 'New York'
  if (session.startsWith('Asian')) return 'Asia'
  return 'Other'
}

function buildConsistencyInput(
  journal: JournalRow | undefined,
  extraNotes: string[],
  hasActiveRules: boolean,
): ConsistencyScoreInputs {
  return {
    hasActiveRules,
    disciplineRating: journal?.discipline_rating,
    followedPlan: journal?.followed_plan,
    hasMeaningfulNotes: hasMeaningfulJournalNotes(journal, extraNotes),
  }
}

/**
 * Computes the current win/loss streak (with type) across all closed trades,
 * most recent first.
 */
export function computeCurrentStreak(
  allTrades: DayToDayTrade[],
): { count: number; type: 'win' | 'loss' | 'none' } {
  const closed = allTrades
    .filter((t) => t.status === 'closed' && t.exit_time)
    .sort((a, b) => new Date(b.exit_time!).getTime() - new Date(a.exit_time!).getTime())

  if (closed.length === 0) return { count: 0, type: 'none' }

  let type: 'win' | 'loss' | null = null
  let count = 0

  for (const trade of closed) {
    const pnl = trade.net_pnl ?? trade.pnl ?? 0
    const outcome: 'win' | 'loss' | null = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : null
    if (outcome === null) continue
    if (type === null) {
      type = outcome
      count = 1
    } else if (outcome === type) {
      count += 1
    } else {
      break
    }
  }

  return type ? { count, type } : { count: 0, type: 'none' }
}

/**
 * Computes today's daily health-check snapshot.
 */
export function computeDayToDaySnapshot(
  allTrades: DayToDayTrade[],
  journalByTradeId: Map<string, JournalRow>,
  notesByTradeId: Map<string, string[]>,
  hasActiveRules: boolean,
  accountRiskPercent: number | null = null,
  now: Date = new Date(),
): DayToDaySnapshot {
  const todaysTrades = allTrades.filter(
    (t) => t.status === 'closed' && isSameLocalDay(t.exit_time, now),
  )

  const currentStreak = computeCurrentStreak(allTrades)

  if (todaysTrades.length === 0) {
    return {
      hasTrades: false,
      pnlAmount: 0,
      pnlPercent: 0,
      totalR: 0,
      tradesTaken: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgR: 0,
      plannedRiskPercent: accountRiskPercent ?? 0,
      actualRiskPercent: 0,
      disciplineScore: 0,
      dailyDrawdown: 0,
      currentStreak,
      sessions: [],
      journalStatus: 'no_trades',
      insight: 'No trades today — a good day to review your rules or revisit past setups.',
    }
  }

  // Results
  let pnlAmount = 0
  let pnlPercent = 0
  let totalR = 0
  let wins = 0
  let losses = 0
  let rSum = 0
  let rCount = 0
  let plannedRiskPercent = 0
  let actualRiskPercent = 0

  // Ordered by exit_time ascending for drawdown calc
  const ordered = [...todaysTrades].sort(
    (a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime(),
  )

  let cumulative = 0
  let peak = 0
  let maxDrawdown = 0

  for (const trade of ordered) {
    const net = trade.net_pnl ?? trade.pnl ?? 0
    pnlAmount += net
    pnlPercent += trade.pnl_percent ?? 0

    if (net > 0) wins += 1
    else if (net < 0) losses += 1

    if (typeof trade.r_multiple === 'number') {
      totalR += trade.r_multiple
      rSum += trade.r_multiple
      rCount += 1
    }

    const risk = trade.risk_percent ?? 0
    if (net < 0) {
      const ratio =
        trade.risk_amount && trade.risk_amount > 0
          ? Math.min(Math.abs(net) / trade.risk_amount, 1.5)
          : 1
      actualRiskPercent += risk * ratio
    }

    cumulative += net
    if (cumulative > peak) peak = cumulative
    const drawdown = peak - cumulative
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  plannedRiskPercent = accountRiskPercent ?? 0

  const tradesTaken = todaysTrades.length
  const winRate = tradesTaken > 0 ? (wins / tradesTaken) * 100 : 0
  const avgR = rCount > 0 ? rSum / rCount : 0

  // Discipline
  const scores = todaysTrades.map((trade) => {
    const journal = journalByTradeId.get(trade.id)
    const extraNotes = notesByTradeId.get(trade.id) || []
    return calculateTradeConsistencyScore(
      buildConsistencyInput(journal, extraNotes, hasActiveRules),
    ).total
  })
  const disciplineScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0

  // Journal status
  const notesFlags = todaysTrades.map((trade) =>
    hasMeaningfulJournalNotes(journalByTradeId.get(trade.id), notesByTradeId.get(trade.id) || []),
  )
  const allJournaled = notesFlags.every(Boolean)
  const noneJournaled = notesFlags.every((f) => !f)
  const journalStatus: DayToDaySnapshot['journalStatus'] = allJournaled
    ? 'completed'
    : noneJournaled
      ? 'incomplete'
      : 'partial'

  // Sessions
  const sessionMap = new Map<SessionBreakdown['label'], SessionBreakdown>()
  for (const trade of todaysTrades) {
    const label = sessionLabel(trade.session)
    const existing = sessionMap.get(label) || { label, trades: 0, pnl: 0 }
    existing.trades += 1
    existing.pnl += trade.net_pnl ?? trade.pnl ?? 0
    sessionMap.set(label, existing)
  }
  const sessionOrder: SessionBreakdown['label'][] = ['London', 'New York', 'Asia', 'Other']
  const sessions = sessionOrder
    .map((label) => sessionMap.get(label))
    .filter((s): s is SessionBreakdown => Boolean(s))

  // Insight (rule-based, deterministic — no external call, keeps this fast)
  let insight = 'Solid day — P&L, discipline, and risk all look in line with your plan.'
  if (plannedRiskPercent > 0 && actualRiskPercent > plannedRiskPercent * 1.3) {
    insight = `You've exceeded your planned risk today — actual risk used is ${Math.round(
      ((actualRiskPercent - plannedRiskPercent) / plannedRiskPercent) * 100,
    )}% above plan.`
  } else if (currentStreak.type === 'loss' && currentStreak.count >= 3) {
    insight = `You're on a ${currentStreak.count}-trade losing streak — a common point where revenge trading starts. Consider stepping back.`
  } else if (disciplineScore < 50) {
    insight = 'Discipline dipped today — most trades weren\'t tagged as plan-following. Review what triggered the deviation.'
  } else if (tradesTaken >= 3 && winRate < 40) {
    insight = 'Win rate is below your usual average today — worth checking if setups matched your criteria.'
  } else if (journalStatus === 'incomplete') {
    insight = 'You haven\'t journaled today\'s trades yet — log them now while details are fresh.'
  }

  return {
    hasTrades: true,
    pnlAmount: Math.round(pnlAmount * 100) / 100,
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    totalR: Math.round(totalR * 100) / 100,
    tradesTaken,
    wins,
    losses,
    winRate: Math.round(winRate * 100) / 100,
    avgR: Math.round(avgR * 100) / 100,
    plannedRiskPercent: Math.round(plannedRiskPercent * 100) / 100,
    actualRiskPercent: Math.round(actualRiskPercent * 100) / 100,
    disciplineScore: Math.round(disciplineScore * 100) / 100,
    dailyDrawdown: -Math.round(maxDrawdown * 100) / 100,
    currentStreak,
    sessions,
    journalStatus,
    insight,
  }
}

/**
 * Computes the last 7 calendar days (including today) of P&L, win rate, and
 * discipline for the mini trend sparklines.
 */
export function computeSevenDayTrend(
  allTrades: DayToDayTrade[],
  journalByTradeId: Map<string, JournalRow>,
  notesByTradeId: Map<string, string[]>,
  hasActiveRules: boolean,
  now: Date = new Date(),
): SevenDayTrendPoint[] {
  const days: SevenDayTrendPoint[] = []

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)

    const dayTrades = allTrades.filter(
      (t) => t.status === 'closed' && isSameLocalDay(t.exit_time, day),
    )

    if (dayTrades.length === 0) {
      days.push({
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        pnl: 0,
        winRate: 0,
        discipline: 0,
        hasTrades: false,
      })
      continue
    }

    const pnl = dayTrades.reduce((sum, t) => sum + (t.net_pnl ?? t.pnl ?? 0), 0)
    const wins = dayTrades.filter((t) => (t.net_pnl ?? t.pnl ?? 0) > 0).length
    const winRate = (wins / dayTrades.length) * 100

    const scores = dayTrades.map((trade) => {
      const journal = journalByTradeId.get(trade.id)
      const extraNotes = notesByTradeId.get(trade.id) || []
      return calculateTradeConsistencyScore(
        buildConsistencyInput(journal, extraNotes, hasActiveRules),
      ).total
    })
    const discipline = scores.reduce((s, v) => s + v, 0) / scores.length

    days.push({
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      pnl: Math.round(pnl * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      discipline: Math.round(discipline * 100) / 100,
      hasTrades: true,
    })
  }

  return days
}
