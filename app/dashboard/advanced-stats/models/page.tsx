import { createClient } from '@/lib/supabase/server'
import { ModelsAnalysisClient } from '@/components/advanced-stats/ModelsAnalysisClient'
import { getSelectedAccountId } from '@/lib/get-selected-account'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Models & Setup | Advanced Statistics',
  description: 'Strategy performance, setup analysis, and bias effects',
}

export default async function ModelsAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const accountId = await getSelectedAccountId(supabase, user.id)

  // Fetch all trades for the user, scoped to the active account
  let tradesQuery = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_time', { ascending: false })

  if (accountId) {
    tradesQuery = tradesQuery.eq('account_id', accountId)
  }

  const { data: trades } = await tradesQuery

  return (
    <ModelsAnalysisClient trades={trades || []} />
  )
}
