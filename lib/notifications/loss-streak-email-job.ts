import { createClient } from '@supabase/supabase-js'
import { computeWinLossStreaks, type StreakTrade } from '@/lib/streaks-analysis-utils'
import { calculateAverageConsistencyScore, hasMeaningfulJournalNotes } from '@/lib/consistency-score'
import { sendLossStreakWarningEmail } from '@/lib/email/resend-service'

export async function sendActiveLossStreakEmails() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (usersError) throw usersError
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of users.users) {
    if (!user.email) { skipped++; continue }
    try {
      const { data: trades, error: tradesError } = await supabase.from('trades').select('id, entry_time, exit_time, pnl, status, strategy').eq('user_id', user.id).eq('status', 'closed').order('entry_time', { ascending: true })
      if (tradesError) throw tradesError
      const streaks = computeWinLossStreaks((trades || []) as StreakTrade[])
      const current = streaks.currentStreak
      if (!current || current.type !== 'loss' || current.length < 2) { skipped++; continue }
      const { data: journals } = await supabase.from('trade_journal').select('trade_id, confidence_level, content, lessons_learned').eq('user_id', user.id)
      const journalByTradeId = new Map((journals || []).map((journal) => [journal.trade_id, journal]))
      const consistency = calculateAverageConsistencyScore((trades || []).map((trade) => {
        const journal = journalByTradeId.get(trade.id)
        return { hasActiveRules: true, activeRulesCount: 1, disciplineRating: journal?.confidence_level, followedPlan: undefined, hasMeaningfulNotes: hasMeaningfulJournalNotes(journal, []) }
      }))
      if (consistency >= 50) { skipped++; continue }
      const lastTrade = trades[trades.length - 1]
      const subject = `${current.length}-trade losing streak`
      const { data: existing } = await supabase.from('ai_email_logs').select('id').eq('user_id', user.id).eq('email_type', 'loss_streak_warning').eq('subject', subject).limit(1)
      if (existing?.length) { skipped++; continue }
      const email = await sendLossStreakWarningEmail({ userEmail: user.email, userName: user.user_metadata?.full_name, streakLength: current.length })
      const { error: logError } = await supabase.from('ai_email_logs').insert({ user_id: user.id, email_type: 'loss_streak_warning', subject, body: `You have lost ${current.length} trades in a row and your consistency is ${consistency}%.`, resend_email_id: email.messageId, status: 'sent', sent_at: new Date().toISOString() })
      if (logError) throw logError
      sent++
      void lastTrade
    } catch (error) {
      errors.push(`${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  return { sent, skipped, errors }
}
