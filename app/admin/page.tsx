import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import {
  Users,
  TrendingUp,
  BrainCircuit,
  MonitorDot,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Activity,
} from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = createAdminClient()

  // Fetch KPIs in parallel
  const [
    { count: totalUsers },
    { count: activeToday },
    { count: newToday },
    { count: mt5Connected },
    { count: totalTrades },
    { count: totalAiLogs },
    { data: recentSignups },
    { data: recentAiErrors },
    { data: recentBrokerErrors },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_sessions').select('*', { count: 'exact', head: true })
      .gte('last_seen_at', new Date(Date.now() - 86400000).toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('mt5_connected', true),
    supabase.from('trades').select('*', { count: 'exact', head: true }),
    supabase.from('ai_logs').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, email, created_at, subscription_tier')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('ai_prompt_logs').select('id, created_at, error_message, model, user_id')
      .eq('success', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('broker_connections').select('id, broker_name, last_sync_error, last_synced_at, user_id')
      .not('last_sync_error', 'is', null).order('last_synced_at', { ascending: false }).limit(5),
  ])

  const kpis = [
    { label: 'Total Users', value: totalUsers ?? 0, icon: Users, color: 'text-primary' },
    { label: 'Active Today', value: activeToday ?? 0, icon: Activity, color: 'text-green-500' },
    { label: 'New Today', value: newToday ?? 0, icon: UserPlus, color: 'text-blue-400' },
    { label: 'MT5 Connected', value: mt5Connected ?? 0, icon: MonitorDot, color: 'text-amber-500' },
    { label: 'Total Trades', value: totalTrades ?? 0, icon: TrendingUp, color: 'text-primary' },
    { label: 'AI Interactions', value: totalAiLogs ?? 0, icon: BrainCircuit, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health and key metrics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4 bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value.toLocaleString()}</p>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Signups */}
        <Card className="p-4 bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Recent Signups</h3>
          </div>
          {recentSignups && recentSignups.length > 0 ? (
            <div className="space-y-2">
              {recentSignups.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{u.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent signups</p>
          )}
        </Card>

        {/* AI Errors */}
        <Card className="p-4 bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-foreground text-sm">Recent AI Failures</h3>
          </div>
          {recentAiErrors && recentAiErrors.length > 0 ? (
            <div className="space-y-2">
              {recentAiErrors.map((e: any) => (
                <div key={e.id}>
                  <p className="text-xs text-muted-foreground truncate">{e.model}</p>
                  <p className="text-xs text-destructive truncate">{e.error_message || 'Unknown error'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-500">No AI failures</p>
          )}
        </Card>

        {/* MT5 Sync Errors */}
        <Card className="p-4 bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <MonitorDot className="w-4 h-4 text-destructive" />
            <h3 className="font-semibold text-foreground text-sm">MT5 Sync Errors</h3>
          </div>
          {recentBrokerErrors && recentBrokerErrors.length > 0 ? (
            <div className="space-y-2">
              {recentBrokerErrors.map((b: any) => (
                <div key={b.id}>
                  <p className="text-xs text-muted-foreground">{b.broker_name}</p>
                  <p className="text-xs text-destructive truncate">{b.last_sync_error}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-500">No sync errors</p>
          )}
        </Card>
      </div>
    </div>
  )
}
