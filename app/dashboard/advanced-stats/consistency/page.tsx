import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  calculateAverageConsistencyBreakdown,
  hasMeaningfulJournalNotes,
  type ConsistencyScoreInputs,
} from "@/lib/consistency-score"
import { ConsistencyAnalysisClient } from "@/components/advanced-stats/ConsistencyAnalysisClient"
import { getSelectedAccountId } from "@/lib/get-selected-account"

export const metadata = {
  title: "Consistency Analysis | Advanced Statistics",
  description: "Rules adherence, risk model, trade model, and journaling breakdown",
}

export default async function ConsistencyAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const accountId = await getSelectedAccountId(supabase, user.id)

  const tradesQuery = supabase
    .from("trades")
    .select("id, entry_time, net_pnl, status, followed_rule_ids, account_id, risk_amount, playbook_id")
    .eq("user_id", user.id)
    .order("entry_time", { ascending: false })

  if (accountId) {
    tradesQuery.eq("account_id", accountId)
  }

  const { data: allTrades } = await tradesQuery

  const tradeIds = (allTrades || []).map((trade) => trade.id)

  const playbookIds = Array.from(
    new Set((allTrades || []).map((trade) => trade.playbook_id).filter((id): id is string => Boolean(id))),
  )

  const [{ data: journalRows }, { data: tradeNotesRows }, { data: playbookRows }, { data: accountRows }] =
    await Promise.all([
      tradeIds.length > 0
        ? supabase
            .from("trade_journal")
            .select("trade_id, discipline_rating, followed_plan, content, session_notes, lessons_learned, mistakes, what_went_well")
            .eq("user_id", user.id)
            .in("trade_id", tradeIds)
        : Promise.resolve({ data: [] }),
      tradeIds.length > 0
        ? supabase
            .from("trade_notes")
            .select("trade_id, note")
            .eq("user_id", user.id)
            .in("trade_id", tradeIds)
        : Promise.resolve({ data: [] }),
      playbookIds.length > 0
        ? supabase
            .from("playbooks")
            .select("id, rules")
            .eq("user_id", user.id)
            .in("id", playbookIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("accounts")
        .select("id, initial_balance, risk_percent, risk_amount")
        .eq("user_id", user.id),
    ])

  // The canonical rule set for each trade is the linked playbook's rules
  // (entry + exit + custom). There is no separate user_rules table.
  const countPlaybookRules = (rules: unknown): number => {
    if (!rules || typeof rules !== "object") return 0
    const bucket = rules as Record<string, unknown>
    return ["entry", "exit", "custom"].reduce((sum, section) => {
      const list = bucket[section]
      if (!Array.isArray(list)) return sum
      return sum + list.filter((rule) => (typeof rule === "string" ? rule.trim().length > 0 : Boolean(rule))).length
    }, 0)
  }
  const ruleCountByPlaybookId = new Map(
    (playbookRows || []).map((playbook) => [playbook.id, countPlaybookRules(playbook.rules)]),
  )
  const hasActiveRules = Array.from(ruleCountByPlaybookId.values()).some((count) => count > 0)
  const accountById = new Map((accountRows || []).map((account) => [account.id, account]))

  const journalByTradeId = new Map((journalRows || []).map((row) => [row.trade_id, row]))
  const notesByTradeId = new Map<string, string[]>()
  for (const row of tradeNotesRows || []) {
    const existing = notesByTradeId.get(row.trade_id) || []
    existing.push(row.note || "")
    notesByTradeId.set(row.trade_id, existing)
  }

  const consistencyInputs: ConsistencyScoreInputs[] = (allTrades || []).map((trade) => {
    const journal = journalByTradeId.get(trade.id)
    const extraNotes = notesByTradeId.get(trade.id) || []
    const tradeRuleCount = trade.playbook_id ? ruleCountByPlaybookId.get(trade.playbook_id) || 0 : 0

    return {
      hasActiveRules: tradeRuleCount > 0,
      activeRulesCount: tradeRuleCount,
      followedRuleIds: trade.followed_rule_ids,
      disciplineRating: journal?.discipline_rating,
      followedPlan: journal?.followed_plan,
      tradeRiskAmount: trade.risk_amount,
      accountRiskAmount: accountById.get(trade.account_id)?.risk_amount,
      tradeRiskPercent: typeof trade.risk_amount === 'number' && accountById.get(trade.account_id)?.initial_balance ? (trade.risk_amount / accountById.get(trade.account_id)!.initial_balance) * 100 : null,
      accountRiskPercent: accountById.get(trade.account_id)?.risk_percent,
      hasMeaningfulNotes: hasMeaningfulJournalNotes(journal, extraNotes),
    }
  })

  const breakdown = calculateAverageConsistencyBreakdown(consistencyInputs)

  const totalDocumentedTrades = (journalRows || []).filter((row) =>
    hasMeaningfulJournalNotes(row, notesByTradeId.get(row.trade_id) || []),
  ).length

  return (
    <ConsistencyAnalysisClient
      breakdown={breakdown}
      totalTrades={allTrades?.length || 0}
      documentedTrades={totalDocumentedTrades}
      hasActiveRules={hasActiveRules}
    />
  )
}
