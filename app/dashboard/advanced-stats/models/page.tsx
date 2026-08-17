import { createClient } from '@/lib/supabase/server'
import { ModelsAnalysisClient } from '@/components/advanced-stats/ModelsAnalysisClient'
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

  // Fetch all trades for the user
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_time', { ascending: false })

  return (
    <ModelsAnalysisClient trades={trades || []} />
  )
}
