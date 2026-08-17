import { createClient } from '@/lib/supabase/server'
import { TimeAnalysisClient } from '@/components/advanced-stats/TimeAnalysisClient'
import { analyzeNewsImpact } from '@/lib/economicCalendar'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Time Analysis | Advanced Statistics',
  description: 'Best sessions, holding time analysis, and news timing impact',
}

export default async function TimeAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all closed trades for the user
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'closed')
    .order('entry_time', { ascending: false })

  // Calculate news impact analysis using economic calendar data
  let newsImpactData = {
    nearNews: { trades: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 },
    normalTime: { trades: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 },
  }

  if (trades && trades.length > 0) {
    try {
      const analysis = await analyzeNewsImpact(trades, 30) // 30-minute window around news
      newsImpactData = {
        nearNews: {
          trades: analysis.nearNews.trades.length,
          wins: analysis.nearNews.trades.filter((t: any) => t.net_pnl > 0).length,
          losses: analysis.nearNews.trades.filter((t: any) => t.net_pnl < 0).length,
          winRate: analysis.nearNews.winRate,
          pnl: Math.round(analysis.nearNews.avgPnl * analysis.nearNews.trades.length * 100) / 100,
        },
        normalTime: {
          trades: analysis.normalTime.trades.length,
          wins: analysis.normalTime.trades.filter((t: any) => t.net_pnl > 0).length,
          losses: analysis.normalTime.trades.filter((t: any) => t.net_pnl < 0).length,
          winRate: analysis.normalTime.winRate,
          pnl: Math.round(analysis.normalTime.avgPnl * analysis.normalTime.trades.length * 100) / 100,
        },
      }
    } catch (error) {
      console.error('[TimeAnalysis] Error analyzing news impact:', error)
      // If analysis fails, continue with empty stats
    }
  }

  return (
    <TimeAnalysisClient trades={trades || []} newsImpactData={newsImpactData} />
  )
}
