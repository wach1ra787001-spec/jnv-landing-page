import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { HeartPulse, CheckCircle, Database, Users, BrainCircuit, MonitorDot } from 'lucide-react'

export default async function AdminSystemHealthPage() {
  const supabase = createAdminClient()

  const start = Date.now()

  const [
    { count: totalProfiles },
    { count: totalTrades },
    { count: totalAiLogs },
    { count: failedAI },
    { count: activeBrokers },
    { count: brokenBrokers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('trades').select('*', { count: 'exact', head: true }),
    supabase.from('ai_prompt_logs').select('*', { count: 'exact', head: true }),
    supabase.from('ai_prompt_logs').select('*', { count: 'exact', head: true }).eq('success', false),
    supabase.from('broker_connections').select('*', { count: 'exact', head: true }).eq('is_connected', true),
    supabase.from('broker_connections').select('*', { count: 'exact', head: true }).not('last_sync_error', 'is', null),
  ])

  const dbLatency = Date.now() - start
  const aiErrorRate = totalAiLogs ? Math.round(((failedAI ?? 0) / totalAiLogs) * 100) : 0

  const services = [
    {
      name: 'Database',
      icon: Database,
      status: dbLatency < 500 ? 'healthy' : 'degraded',
      detail: `${dbLatency}ms latency`,
    },
    {
      name: 'Auth',
      icon: Users,
      status: 'healthy',
      detail: `${totalProfiles ?? 0} users`,
    },
    {
      name: 'AI Service',
      icon: BrainCircuit,
      status: aiErrorRate < 10 ? 'healthy' : aiErrorRate < 25 ? 'degraded' : 'down',
      detail: `${aiErrorRate}% error rate`,
    },
    {
      name: 'MT5 Connections',
      icon: MonitorDot,
      status: (brokenBrokers ?? 0) === 0 ? 'healthy' : 'degraded',
      detail: `${activeBrokers ?? 0} active, ${brokenBrokers ?? 0} errors`,
    },
  ]

  const statusStyle: Record<string, { dot: string; badge: string }> = {
    healthy: { dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-500' },
    degraded: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-500' },
    down: { dot: 'bg-destructive', badge: 'bg-destructive/10 text-destructive' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">System Health</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time service status and database statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map(svc => {
          const Icon = svc.icon
          const style = statusStyle[svc.status]
          return (
            <Card key={svc.name} className="p-4 bg-card border border-border/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm">{svc.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{svc.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{svc.detail}</p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot} shadow-sm`} />
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: totalProfiles ?? 0 },
          { label: 'Total Trades', value: totalTrades ?? 0 },
          { label: 'AI Requests', value: totalAiLogs ?? 0 },
          { label: 'Broker Connections', value: activeBrokers ?? 0 },
        ].map(stat => (
          <Card key={stat.label} className="p-4 bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
