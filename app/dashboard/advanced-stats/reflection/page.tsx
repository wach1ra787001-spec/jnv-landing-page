import { createClient } from '@/lib/supabase/server'
import { ReflectionAnalysisClient } from '@/components/advanced-stats/ReflectionAnalysisClient'
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

  // Fetch all trades for the user
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_time', { ascending: false })

  return (
    <ReflectionAnalysisClient trades={trades || []} />
  )
}
