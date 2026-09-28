import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPremarketReminderEmail } from '@/lib/email/resend-service'

export const dynamic = 'force-dynamic'
const sessions = [{ name: 'asian', label: 'Asian', hour: 23 }, { name: 'london', label: 'London', hour: 7 }, { name: 'new_york', label: 'New York', hour: 13 }]

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authorization !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const now = new Date()
  const nextSession = sessions.find((session) => { const delta = (session.hour - now.getUTCHours() + 24) % 24; return delta === 1 && now.getUTCMinutes() < 5 })
  if (!nextSession) return NextResponse.json({ sent: 0, message: 'No session reminder due.' })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: preferences, error } = await supabase.from('notification_preferences').select('user_id, premarket_email_enabled').eq('premarket_reminders_enabled', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  let sent = 0
  for (const preference of preferences || []) {
    const key = `${now.toISOString().slice(0, 10)}-${nextSession.name}`
    const { data: existing } = await supabase.from('notification_logs').select('id').eq('user_id', preference.user_id).eq('notification_type', 'premarket_reminder').contains('metadata', { key }).maybeSingle()
    if (existing) continue
    const { data: userData } = await supabase.auth.admin.getUserById(preference.user_id)
    const user = userData.user
    if (!user?.email) continue
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    const firstName = (profile?.full_name || 'Trader').split(' ')[0]
    await supabase.from('notification_logs').insert({ user_id: user.id, channel: 'in_app', notification_type: 'premarket_reminder', title: `${nextSession.label} session starts in one hour`, message: 'Log your pre-market routine before the session begins.', href: `/dashboard/journal/premarket?session=${nextSession.name}`, status: 'unread', metadata: { key, session: nextSession.name } })
    if (preference.premarket_email_enabled) {
      try { const email = await sendPremarketReminderEmail({ userEmail: user.email, firstName, sessionName: nextSession.label, unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://jnvpro.com'}/dashboard/settings` }); await supabase.from('notification_logs').insert({ user_id: user.id, channel: 'email', notification_type: 'premarket_reminder', title: `${nextSession.label} pre-market reminder`, message: 'Reminder email sent.', status: 'sent', metadata: { key, resend_id: email?.id } }) } catch (emailError) { console.error('[v0] Premarket reminder email failed:', emailError) }
    }
    sent++
  }
  return NextResponse.json({ sent, session: nextSession.name })
}
