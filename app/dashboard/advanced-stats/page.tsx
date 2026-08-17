import { createClient } from '@/lib/supabase/server'
import { AdvancedStatsMenu } from '@/components/advanced-stats/AdvancedStatsMenu'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Advanced Statistics | JnV Journal',
  description: 'Deep insights into your trading performance and patterns',
}

export default async function AdvancedStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile to determine tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const userTier = (profile?.subscription_tier as 'free' | 'pro' | 'elite') || 'free'

  return (
    <AdvancedStatsMenu userTier={userTier} />
  )
}

