import { createClient } from "@/lib/supabase/server"
import { HeroCard } from "@/components/dashboard/hero-card"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { TradesTable } from "@/components/dashboard/trades-table"
import { OpenPositionsWidget } from "@/components/OpenPositionsWidget"
import { AccountRequiredPrompt } from "@/components/dashboard/account-required-prompt"
import { PnLChart } from "@/components/PnLChart"
import { calculateMetricsFromTrades } from "@/lib/calculate-metrics"
import {
  calculateAverageConsistencyScore,
  hasMeaningfulJournalNotes,
  type ConsistencyScoreInputs,
} from "@/lib/consistency-score"
import {
  computeDayToDaySnapshot,
  computeSevenDayTrend,
} from "@/lib/day-to-day-analysis"
import { DayToDayCard } from "@/components/dashboard/day-to-day-card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single()

  // Fetch default account
  const { data: defaultAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user?.id)
    .eq("is_active", true)
    .single()

  const accountId = profile?.default_account_id || defaultAccount?.id

  // Fetch all trades for metric calculation - filtered by account
  const tradesQuery = supabase
    .from("trades")
    .select("*")
    .eq("user_id", user?.id)
    .order("entry_time", { ascending: false })

  if (accountId) {
    tradesQuery.eq("account_id", accountId)
  }

  const { data: allTrades } = await tradesQuery

  // Fetch trade metrics from database or calculate from trades
  let { data: metrics } = await supabase
    .from("trade_metrics")
    .select("*")
    .eq("user_id", user?.id)
    .single()

  // If no metrics in DB, calculate from actual trades
  if (!metrics && allTrades && allTrades.length > 0) {
    const calculatedMetrics = calculateMetricsFromTrades(allTrades)
    metrics = {
      id: '',
      user_id: user?.id || '',
      total_trades: calculatedMetrics.total_trades,
      total_profit_loss: calculatedMetrics.total_profit_loss,
      win_rate: calculatedMetrics.win_rate,
      monthly_growth: calculatedMetrics.monthly_growth,
      growth_vs_last_month: calculatedMetrics.growth_vs_last_month,
      avg_trades_per_day: calculatedMetrics.avg_trades_per_day,
      risk_exposure: calculatedMetrics.risk_exposure,
      current_streak: calculatedMetrics.current_streak,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // Fetch recent trades (last 5) - filtered by account
  const recentTradesQuery = supabase
    .from("trades")
    .select("id, symbol, direction, r_multiple, net_pnl, status, session, entry_time")
    .eq("user_id", user?.id)
    .order("entry_time", { ascending: false })
    .limit(5)

  if (accountId) {
    recentTradesQuery.eq("account_id", accountId)
  }

  const { data: recentTrades } = await recentTradesQuery

  const userName = profile?.full_name?.split(" ")[0] || "Trader"
  const currency = profile?.currency || 'USD'

  // Consistency score: weighted average across all trades.
  //   30% rules followed + 20% followed risk model + 20% followed trade model + 30% journaled
  // See lib/consistency-score.ts for the full breakdown and data-availability notes.
  const tradeIds = (allTrades || []).map((trade) => trade.id)

  const [{ data: journalRows }, { data: tradeNotesRows }, { count: activeRulesCount }] =
    await Promise.all([
      tradeIds.length > 0
        ? supabase
            .from("trade_journal")
            .select("trade_id, discipline_rating, followed_plan, content, session_notes, lessons_learned, mistakes, what_went_well")
            .eq("user_id", user?.id)
            .in("trade_id", tradeIds)
        : Promise.resolve({ data: [] }),
      tradeIds.length > 0
        ? supabase
            .from("trade_notes")
            .select("trade_id, note")
            .eq("user_id", user?.id)
            .in("trade_id", tradeIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("user_rules")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id)
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

  const consistency = calculateAverageConsistencyScore(consistencyInputs)

  const totalDocumentedTrades = (journalRows || []).filter((row) =>
    hasMeaningfulJournalNotes(row, notesByTradeId.get(row.trade_id) || []),
  ).length

  const dayToDaySnapshot = computeDayToDaySnapshot(
    allTrades || [],
    journalByTradeId,
    notesByTradeId,
    hasActiveRules,
  )
  const sevenDayTrend = computeSevenDayTrend(
    allTrades || [],
    journalByTradeId,
    notesByTradeId,
    hasActiveRules,
  )

  // Transform trades data for the table component
  const formattedTrades = (recentTrades || []).map(trade => ({
    id: trade.id,
    symbol: trade.symbol,
    type: trade.direction?.toLowerCase() as "long" | "short" || "long",
    riskReward: trade.r_multiple || 0,
    pnl: trade.net_pnl || 0,
    status: trade.status || "open",
    session: trade.session || "N/A"
  }))

  return (
    <div className="space-y-8 pb-8">
      {/* Account Required Prompt */}
      <AccountRequiredPrompt />

      {/* Hero Card - Full Width */}
      <div className="pt-2">
        <HeroCard 
          userName={userName} 
          streakDays={metrics?.current_streak || 0} 
        />
      </div>

      {/* KPI Ribbon - 4 Column Grid with improved spacing */}
      <div>
        <KPICards 
          pnl={metrics?.total_profit_loss || 0}
          growthPercent={metrics?.monthly_growth || 0}
          growthVsLastMonth={metrics?.growth_vs_last_month || 0}
          totalTrades={metrics?.total_trades || 0}
          avgTradesPerDay={metrics?.avg_trades_per_day || 0}
          winRate={metrics?.win_rate || 0}
          riskExposure={metrics?.risk_exposure || 0}
          consistency={consistency}
          documentedTrades={totalDocumentedTrades}
        />
      </div>

      {/* Day-to-Day - Fast daily health check */}
      <div>
        <DayToDayCard
          snapshot={dayToDaySnapshot}
          trend={sevenDayTrend}
          currency={currency}
        />
      </div>

      {/* P&L Chart - Full Width */}
      <div>
        <PnLChart 
          userId={user?.id || ''}
          currency={currency}
          height={350}
          accountId={accountId}
        />
      </div>

      {/* Bottom Row - 2 Column Equal Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TradesTable 
          title="Recent Trades" 
          trades={formattedTrades.length > 0 ? formattedTrades : undefined}
        />
        <OpenPositionsWidget 
          userId={user?.id || ''}
          currency={currency}
        />
      </div>
    </div>
  )
}
