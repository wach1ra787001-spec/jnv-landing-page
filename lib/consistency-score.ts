/**
 * Consistency Score
 * ------------------
 * A weighted, per-trade discipline score averaged across all of a user's trades.
 *
 * Weights (sum to 100):
 *   - Rules followed:        30%  -> scaled by fraction of rules followed
 *   - Followed risk model:   20%  -> all-or-nothing
 *   - Followed trade model:  20%  -> all-or-nothing
 *   - Meaningful journaling: 30%  -> all-or-nothing (any non-empty note)
 *
 * Example: 3/4 rules followed (22.5) + risk model followed (20) + trade model
 * followed (20) + journaled (30) = 92.5
 *
 * Data availability note: the schema does not yet track which *individual*
 * rules were followed per trade, nor separate "followed risk model" /
 * "followed my model" booleans. Until dedicated fields exist, this uses the
 * best-fit proxies available today:
 *   - `discipline_rating` (1-10 self-rating captured in trade_journal) is
 *     used as the fraction of rules followed for the Rules component.
 *   - Risk compliance is calculated from the trade and account risk limits.
 *   - Trade Model is awarded when all rules are followed, risk is compliant,
 *     and the trade has meaningful journal notes. The legacy `followed_plan`
 *     checkbox is intentionally not required for this score.
 * When per-category tracking is added, swap the inputs below for the real
 * values without changing the weighting logic.
 */

export const CONSISTENCY_WEIGHTS = {
  rules: 30,
  riskModel: 20,
  tradeModel: 20,
  journaling: 30,
} as const

export interface ConsistencyScoreInputs {
  /** Does the user have at least one active rule configured in Manage Rules? */
  hasActiveRules: boolean
  /** Number of active rules configured by the user. */
  activeRulesCount?: number
  /** IDs of the rules explicitly checked for this trade. */
  followedRuleIds?: string[] | null
  /** 1-10 self-rating used only for legacy trades without per-rule selections. */
  disciplineRating: number | null | undefined
  /** Legacy journal field retained for compatibility; not required for Trade Model scoring. */
  followedPlan: boolean | null | undefined
  /** Trade risk amount and selected account limits. Missing values are non-compliant. */
  tradeRiskAmount?: number | null
  accountRiskAmount?: number | null
  tradeRiskPercent?: number | null
  accountRiskPercent?: number | null
  /** Does the trade have any non-empty journal note text? */
  hasMeaningfulNotes: boolean
}

export interface ConsistencyScoreBreakdown {
  rulesScore: number
  riskModelScore: number
  tradeModelScore: number
  journalingScore: number
  total: number
}

const DISCIPLINE_RATING_MAX = 10

/**
 * Calculates the weighted consistency score for a single trade.
 */
export function calculateTradeConsistencyScore(
  inputs: ConsistencyScoreInputs,
): ConsistencyScoreBreakdown {
  const { hasActiveRules, activeRulesCount = 0, followedRuleIds, disciplineRating, followedPlan, tradeRiskAmount, accountRiskAmount, tradeRiskPercent, accountRiskPercent, hasMeaningfulNotes } = inputs

  const rulesFollowed = !hasActiveRules || (Array.isArray(followedRuleIds) && activeRulesCount > 0 && followedRuleIds.length >= activeRulesCount)
  const riskCompliant = typeof tradeRiskAmount === 'number' && typeof accountRiskAmount === 'number' && tradeRiskAmount <= accountRiskAmount && typeof tradeRiskPercent === 'number' && typeof accountRiskPercent === 'number' && tradeRiskPercent <= accountRiskPercent
  const journalCompleted = hasMeaningfulNotes

  // Rules followed (30%) - use the per-trade checklist when available.
  let rulesScore = 0
  if (hasActiveRules) {
    const hasChecklist = Array.isArray(followedRuleIds)
    const fraction = hasChecklist && activeRulesCount > 0
      ? Math.min(followedRuleIds.length, activeRulesCount) / activeRulesCount
      : typeof disciplineRating === 'number' && disciplineRating > 0
        ? Math.min(disciplineRating, DISCIPLINE_RATING_MAX) / DISCIPLINE_RATING_MAX
        : 0
    rulesScore = fraction * CONSISTENCY_WEIGHTS.rules
  }

  // Followed risk model (20%) - all-or-nothing.
  const riskModelScore = riskCompliant ? CONSISTENCY_WEIGHTS.riskModel : 0

  // Trade Model is earned only when rules, risk, and journaling are all complete.
  const tradeModelScore = rulesFollowed && riskCompliant && journalCompleted
    ? CONSISTENCY_WEIGHTS.tradeModel
    : 0

  // Meaningful journaling (30%) - all-or-nothing.
  const journalingScore = journalCompleted ? CONSISTENCY_WEIGHTS.journaling : 0

  const total = rulesScore + riskModelScore + tradeModelScore + journalingScore

  return {
    rulesScore: Math.round(rulesScore * 100) / 100,
    riskModelScore,
    tradeModelScore,
    journalingScore,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Calculates the average consistency score across a set of trades. Trades
 * without any journal entry score 0 across the board, which correctly pulls
 * the average down for undocumented trades.
 */
export function calculateAverageConsistencyScore(
  trades: ConsistencyScoreInputs[],
): number {
  if (!trades || trades.length === 0) return 0

  const totalScore = trades.reduce((sum, trade) => {
    return sum + calculateTradeConsistencyScore(trade).total
  }, 0)

  return Math.round((totalScore / trades.length) * 100) / 100
}

export interface ConsistencyAverageBreakdown {
  rulesScore: number
  riskModelScore: number
  tradeModelScore: number
  journalingScore: number
  /** Each category expressed as a % of its own max weight (0-100), for progress bars. */
  rulesPercent: number
  riskModelPercent: number
  tradeModelPercent: number
  journalingPercent: number
  total: number
  tradeCount: number
}

/**
 * Calculates the average consistency score AND the per-category breakdown
 * across a set of trades, so the UI can render a component-level view
 * (e.g. Rules / Risk Model / Trade Model / Journaling bars) instead of just
 * the single blended total.
 */
export function calculateAverageConsistencyBreakdown(
  trades: ConsistencyScoreInputs[],
): ConsistencyAverageBreakdown {
  if (!trades || trades.length === 0) {
    return {
      rulesScore: 0,
      riskModelScore: 0,
      tradeModelScore: 0,
      journalingScore: 0,
      rulesPercent: 0,
      riskModelPercent: 0,
      tradeModelPercent: 0,
      journalingPercent: 0,
      total: 0,
      tradeCount: 0,
    }
  }

  const totals = trades.reduce(
    (acc, trade) => {
      const score = calculateTradeConsistencyScore(trade)
      acc.rulesScore += score.rulesScore
      acc.riskModelScore += score.riskModelScore
      acc.tradeModelScore += score.tradeModelScore
      acc.journalingScore += score.journalingScore
      acc.total += score.total
      return acc
    },
    { rulesScore: 0, riskModelScore: 0, tradeModelScore: 0, journalingScore: 0, total: 0 },
  )

  const count = trades.length
  const rulesScore = Math.round((totals.rulesScore / count) * 100) / 100
  const riskModelScore = Math.round((totals.riskModelScore / count) * 100) / 100
  const tradeModelScore = Math.round((totals.tradeModelScore / count) * 100) / 100
  const journalingScore = Math.round((totals.journalingScore / count) * 100) / 100
  const total = Math.round((totals.total / count) * 100) / 100

  return {
    rulesScore,
    riskModelScore,
    tradeModelScore,
    journalingScore,
    rulesPercent: Math.round((rulesScore / CONSISTENCY_WEIGHTS.rules) * 100),
    riskModelPercent: Math.round((riskModelScore / CONSISTENCY_WEIGHTS.riskModel) * 100),
    tradeModelPercent: Math.round((tradeModelScore / CONSISTENCY_WEIGHTS.tradeModel) * 100),
    journalingPercent: Math.round((journalingScore / CONSISTENCY_WEIGHTS.journaling) * 100),
    total,
    tradeCount: count,
  }
}

/**
 * Helper: determines whether a trade has "meaningful" journal notes, i.e.
 * any non-empty text across the journal's note fields.
 */
export function hasMeaningfulJournalNotes(journal: {
  content?: string | null
  session_notes?: string | null
  pre_trade_notes?: string | null
  post_trade_notes?: string | null
  lessons_learned?: string | null
  mistakes?: string | null
  what_went_well?: string | null
} | null | undefined, extraNotes?: string[]): boolean {
  const fields = [
    journal?.content,
    journal?.session_notes,
    journal?.pre_trade_notes,
    journal?.post_trade_notes,
    journal?.lessons_learned,
    journal?.mistakes,
    journal?.what_went_well,
    ...(extraNotes || []),
  ]

  return fields.some((field) => typeof field === 'string' && field.trim().length > 0)
}
