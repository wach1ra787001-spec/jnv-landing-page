import { createClient } from '@/lib/supabase/server'
import { ModelsAnalysisClient } from '@/components/advanced-stats/ModelsAnalysisClient'
import { getUserTrades } from '@/lib/services/trade-service'
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

  // Reuse Trade History's canonical account-scoped trade query.
  const trades = await getUserTrades('history')

  return (
    <ModelsAnalysisClient trades={trades || []} />
  )
}
