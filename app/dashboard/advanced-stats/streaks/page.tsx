import { createClient } from '@/lib/supabase/server'
import { StreaksAnalysisClient } from '@/components/advanced-stats/StreaksAnalysisClient'
import { getSelectedAccountId } from '@/lib/get-selected-account'
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

  const accountId = await getSelectedAccountId(supabase, user.id)

  // Read the base trades table directly. The journal view can be absent or
  // stale for imported/manual accounts, which previously made every card empty.
  let tradesQuery = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_time', { ascending: false })

  if (accountId) tradesQuery = tradesQuery.eq('account_id', accountId)

  const { data: trades, error: tradesError } = await tradesQuery
  if (tradesError) console.error('[v0] Advanced stats trade query failed:', tradesError)

  const tradeIds = (trades || []).map((trade) => trade.id)
  const { data: journals } = tradeIds.length
    ? await supabase.from('trade_journal').select('*').eq('user_id', user.id).in('trade_id', tradeIds)
    : { data: [] }
  const journalByTrade = new Map((journals || []).map((journal) => [journal.trade_id, journal]))
  const enrichedTrades = (trades || []).map((trade) => ({ ...trade, ...(journalByTrade.get(trade.id) || {}) }))

  return <StreaksAnalysisClient trades={enrichedTrades} />
}
