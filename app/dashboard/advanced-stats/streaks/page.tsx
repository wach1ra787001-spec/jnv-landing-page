import { createClient } from '@/lib/supabase/server'
import { StreaksAnalysisClient } from '@/components/advanced-stats/StreaksAnalysisClient'
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

  // Fetch all trades for the user
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_time', { ascending: false })

  return (
    <StreaksAnalysisClient trades={trades || []} />
  )
}
