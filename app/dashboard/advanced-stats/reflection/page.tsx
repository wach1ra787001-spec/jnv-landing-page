import { createClient } from '@/lib/supabase/server'
import { ReflectionAnalysisClient } from '@/components/advanced-stats/ReflectionAnalysisClient'
import { getSelectedAccountId } from '@/lib/get-selected-account'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Reflection Analysis | Advanced Statistics',
  description: 'Journal impact, planning effectiveness, and pre-market preparation',
}

export default async function ReflectionAnalysisPage() {
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
    <ReflectionAnalysisClient trades={trades || []} />
  )
}
