import { createClient } from "@/lib/supabase/server"
import { HeroCard } from "@/components/dashboard/hero-card"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { AnalysisGrid } from "@/components/dashboard/analysis-grid"
import { TradesTable } from "@/components/dashboard/trades-table"
import { OpenPositionsWidget } from "@/components/OpenPositionsWidget"
import { AccountRequiredPrompt } from "@/components/dashboard/account-required-prompt"
import { PnLChart } from "@/components/PnLChart"
import { calculateMetricsFromTrades } from "@/lib/calculate-metrics"

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

  // Calculate consistency: wins with documented trades (notes + screenshots) / total trades
  const documentedWins = (allTrades || []).filter(trade => {
    const isWinningTrade = (trade.net_pnl || 0) > 0
    const hasNotes = trade.notes && trade.notes.trim().length > 0
    const hasScreenshots = trade.screenshot_urls && Array.isArray(trade.screenshot_urls) && trade.screenshot_urls.length > 0
    return isWinningTrade && hasNotes && hasScreenshots
  }).length

  const totalDocumentedTrades = (allTrades || []).filter(trade => {
    const hasNotes = trade.notes && trade.notes.trim().length > 0
    const hasScreenshots = trade.screenshot_urls && Array.isArray(trade.screenshot_urls) && trade.screenshot_urls.length > 0
    return hasNotes && hasScreenshots
  }).length

  const consistency = totalDocumentedTrades > 0 ? Math.round((documentedWins / totalDocumentedTrades) * 100) : 0

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

      {/* P&L Chart - Full Width */}
      <div>
        <PnLChart 
          userId={user?.id || ''}
          currency={currency}
          height={350}
          accountId={accountId}
        />
      </div>

      {/* Main Analysis Row - 66% / 33% Split with premium spacing */}
      <AnalysisGrid 
        userId={user?.id || ''}
        currency={currency}
        trades={allTrades || []}
      />

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
