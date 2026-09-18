import { createClient } from '@/lib/supabase/server'
import { ReflectionAnalysisClient } from '@/components/advanced-stats/ReflectionAnalysisClient'
import { getUserTrades } from '@/lib/services/trade-service'
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

  // Reuse Trade History's canonical account-scoped trade query.
  const trades = await getUserTrades('all')

  return (
    <ReflectionAnalysisClient trades={trades || []} />
  )
}
