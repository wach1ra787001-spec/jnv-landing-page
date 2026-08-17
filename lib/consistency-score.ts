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
 *   - `followed_plan` (single boolean captured in trade_journal) is used as
 *     the signal for BOTH the "followed risk model" and "followed my model"
 *     components, since a trading "plan" is understood to encompass both.
 * When per-rule and per-category tracking is added, swap the inputs below
 * for the real values without changing the weighting logic.
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
  /** 1-10 self-rating of how well the trade's rules were followed (proxy for rules-followed fraction). */
  disciplineRating: number | null | undefined
  /** Did the user follow their plan for this trade? Used as proxy for risk-model + trade-model adherence. */
  followedPlan: boolean | null | undefined
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
  const { hasActiveRules, disciplineRating, followedPlan, hasMeaningfulNotes } = inputs

  // Rules followed (30%) - scaled by fraction of rules followed.
  // Zero active rules configured => 0 points (user hasn't set up their rules checklist).
  let rulesScore = 0
  if (hasActiveRules && typeof disciplineRating === 'number' && disciplineRating > 0) {
    const fraction = Math.min(disciplineRating, DISCIPLINE_RATING_MAX) / DISCIPLINE_RATING_MAX
    rulesScore = fraction * CONSISTENCY_WEIGHTS.rules
  }

  // Followed risk model (20%) - all-or-nothing.
  const riskModelScore = followedPlan === true ? CONSISTENCY_WEIGHTS.riskModel : 0

  // Followed trade model / strategy (20%) - all-or-nothing.
  const tradeModelScore = followedPlan === true ? CONSISTENCY_WEIGHTS.tradeModel : 0

  // Meaningful journaling (30%) - all-or-nothing.
  const journalingScore = hasMeaningfulNotes ? CONSISTENCY_WEIGHTS.journaling : 0

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
