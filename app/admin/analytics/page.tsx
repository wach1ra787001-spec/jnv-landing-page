import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Repeat } from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient()

  const [
    { data: signupsByDay },
    { data: planDist },
    { data: tradesByDay },
    { data: aiByDay },
  ] = await Promise.all([
    // Signups last 14 days grouped by date
    supabase.from('profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .order('created_at', { ascending: true }),
    // Plan distribution
    supabase.from('profiles')
      .select('subscription_tier'),
    // Trades last 14 days
    supabase.from('trades')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),
    // AI logs last 14 days
    supabase.from('ai_logs')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),
  ])

  // Group signups by day
  const signupMap: Record<string, number> = {}
  for (const p of signupsByDay || []) {
    const d = new Date(p.created_at).toLocaleDateString()
    signupMap[d] = (signupMap[d] || 0) + 1
  }

  // Plan distribution
  const planMap: Record<string, number> = {}
  for (const p of planDist || []) {
    const tier = (p as any).subscription_tier || 'free'
    planMap[tier] = (planMap[tier] || 0) + 1
  }

  // Trades by day
  const tradeMap: Record<string, number> = {}
  for (const t of tradesByDay || []) {
    const d = new Date(t.created_at).toLocaleDateString()
    tradeMap[d] = (tradeMap[d] || 0) + 1
  }

  const maxSignups = Math.max(...Object.values(signupMap), 1)
  const maxTrades = Math.max(...Object.values(tradeMap), 1)

  // Build last 14 days labels
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000)
    return d.toLocaleDateString()
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform growth and usage over time</p>
      </div>

      {/* Signups chart */}
      <Card className="p-5 bg-card border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">New Signups — Last 14 Days</h3>
        </div>
        <div className="flex items-end gap-1 h-28">
          {days.map(day => {
            const count = signupMap[day] || 0
            const pct = Math.round((count / maxSignups) * 100)
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                <div
                  className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors"
                  style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{days[0]}</span>
          <span className="text-xs text-muted-foreground">{days[days.length - 1]}</span>
        </div>
      </Card>

      {/* Trades chart */}
      <Card className="p-5 bg-card border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <h3 className="font-semibold text-foreground text-sm">Trades Logged — Last 14 Days</h3>
        </div>
        <div className="flex items-end gap-1 h-28">
          {days.map(day => {
            const count = tradeMap[day] || 0
            const pct = Math.round((count / maxTrades) * 100)
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                <div
                  className="w-full rounded-t bg-green-500/60 hover:bg-green-500 transition-colors"
                  style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{days[0]}</span>
          <span className="text-xs text-muted-foreground">{days[days.length - 1]}</span>
        </div>
      </Card>

      {/* Plan distribution */}
      <Card className="p-5 bg-card border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-foreground text-sm">Plan Distribution</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(planMap).sort((a, b) => b[1] - a[1]).map(([plan, count]) => {
            const total = Object.values(planMap).reduce((s, c) => s + c, 0)
            const pct = total ? Math.round((count / total) * 100) : 0
            return (
              <div key={plan}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-foreground capitalize">{plan}</span>
                  <span className="text-sm text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
