import { createClient } from '@/lib/supabase/server'
import { StreaksAnalysisClient } from '@/components/advanced-stats/StreaksAnalysisClient'
import { getUserTrades } from '@/lib/services/trade-service'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Streaks & Discipline | Advanced Statistics',
  description: 'Winning streaks, direction bias, and discipline tracking',
}

export default async function StreaksAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Reuse Trade History's canonical account-scoped trade query.
  const trades = await getUserTrades('history')

  const tradeIds = (trades || []).map((trade) => trade.id)
  const { data: journals } = tradeIds.length
    ? await supabase.from('trade_journal').select('*').eq('user_id', user.id).in('trade_id', tradeIds)
    : { data: [] }
  const journalByTrade = new Map((journals || []).map((journal) => [journal.trade_id, journal]))
  const enrichedTrades = (trades || []).map((trade) => ({ ...trade, ...(journalByTrade.get(trade.id) || {}) }))

  return <StreaksAnalysisClient trades={enrichedTrades} />
}
