import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { BrainCircuit, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'

export default async function AdminAIPage() {
  const supabase = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    { count: totalPrompts },
    { count: successCount },
    { count: failCount },
    { data: todayLogs },
    { data: monthLogs },
    { data: recentFailures },
    { data: topUsers },
  ] = await Promise.all([
    supabase.from('ai_prompt_logs').select('*', { count: 'exact', head: true }),
    supabase.from('ai_prompt_logs').select('*', { count: 'exact', head: true }).eq('success', true),
    supabase.from('ai_prompt_logs').select('*', { count: 'exact', head: true }).eq('success', false),
    supabase.from('ai_prompt_logs').select('total_tokens, latency_ms, success')
      .gte('created_at', today.toISOString()),
    supabase.from('ai_prompt_logs').select('total_tokens')
      .gte('created_at', monthStart.toISOString()),
    supabase.from('ai_prompt_logs').select('id, model, error_message, created_at, user_id')
      .eq('success', false).order('created_at', { ascending: false }).limit(10),
    supabase.from('ai_prompt_logs').select('user_id, total_tokens')
      .order('total_tokens', { ascending: false }).limit(5),
  ])

  const todayTokens = (todayLogs || []).reduce((s: number, l: any) => s + (l.total_tokens || 0), 0)
  const monthTokens = (monthLogs || []).reduce((s: number, l: any) => s + (l.total_tokens || 0), 0)
  const avgLatency = todayLogs && todayLogs.length > 0
    ? Math.round((todayLogs as any[]).reduce((s, l) => s + (l.latency_ms || 0), 0) / todayLogs.length)
    : 0
  const errorRate = totalPrompts ? Math.round(((failCount ?? 0) / totalPrompts) * 100) : 0

  const kpis = [
    { label: 'Total Prompts', value: (totalPrompts ?? 0).toLocaleString(), icon: BrainCircuit, color: 'text-primary' },
    { label: 'Success', value: (successCount ?? 0).toLocaleString(), icon: CheckCircle, color: 'text-green-500' },
    { label: 'Failures', value: (failCount ?? 0).toLocaleString(), icon: XCircle, color: 'text-destructive' },
    { label: 'Error Rate', value: `${errorRate}%`, icon: Zap, color: 'text-amber-500' },
    { label: 'Tokens Today', value: todayTokens.toLocaleString(), icon: Zap, color: 'text-purple-400' },
    { label: 'Avg Latency', value: `${avgLatency}ms`, icon: Clock, color: 'text-blue-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">AI Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Token usage, costs, and error tracking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4 bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent failures */}
        <Card className="p-4 bg-card border border-border/50">
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            Recent AI Failures
          </h3>
          {(recentFailures || []).length === 0 ? (
            <p className="text-sm text-green-500">No failures</p>
          ) : (
            <div className="space-y-2">
              {(recentFailures as any[]).map((f) => (
                <div key={f.id} className="border-l-2 border-destructive/40 pl-3">
                  <p className="text-xs font-medium text-foreground">{f.model || 'Unknown model'}</p>
                  <p className="text-xs text-destructive truncate">{f.error_message || 'No error message'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Token summary */}
        <Card className="p-4 bg-card border border-border/50">
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Token Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Today</span>
              <span className="text-sm font-medium text-foreground">{todayTokens.toLocaleString()} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="text-sm font-medium text-foreground">{monthTokens.toLocaleString()} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">All Time</span>
              <span className="text-sm font-medium text-foreground">{(totalPrompts ?? 0).toLocaleString()} requests</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
