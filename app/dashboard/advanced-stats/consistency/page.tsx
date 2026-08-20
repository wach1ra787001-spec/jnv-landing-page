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
    .select("id, entry_time, net_pnl, status")
    .eq("user_id", user.id)
    .order("entry_time", { ascending: false })

  if (accountId) {
    tradesQuery.eq("account_id", accountId)
  }

  const { data: allTrades } = await tradesQuery

  const tradeIds = (allTrades || []).map((trade) => trade.id)

  const [{ data: journalRows }, { data: tradeNotesRows }, { count: activeRulesCount }] =
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
      supabase
        .from("user_rules")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true),
    ])

  const hasActiveRules = (activeRulesCount || 0) > 0

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

    return {
      hasActiveRules,
      disciplineRating: journal?.discipline_rating,
      followedPlan: journal?.followed_plan,
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
