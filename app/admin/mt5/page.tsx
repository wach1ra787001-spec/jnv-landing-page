import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { MonitorDot, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default async function AdminMT5Page() {
  const supabase = createAdminClient()

  const [
    { count: totalConnections },
    { count: activeConnections },
    { data: connections },
  ] = await Promise.all([
    supabase.from('broker_connections').select('*', { count: 'exact', head: true }),
    supabase.from('broker_connections').select('*', { count: 'exact', head: true }).eq('is_connected', true),
    supabase.from('broker_connections')
      .select('id, broker_name, account_name, account_login, is_connected, is_live, last_synced_at, last_sync_error, user_id')
      .order('last_synced_at', { ascending: false })
      .limit(50),
  ])

  const failedConnections = (connections || []).filter((c: any) => c.last_sync_error)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">MT5 Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Broker connections and sync status</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Connections', value: totalConnections ?? 0, icon: MonitorDot, color: 'text-primary' },
          { label: 'Active', value: activeConnections ?? 0, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Inactive', value: (totalConnections ?? 0) - (activeConnections ?? 0), icon: XCircle, color: 'text-muted-foreground' },
          { label: 'Sync Errors', value: failedConnections.length, icon: XCircle, color: 'text-destructive' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4 bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </Card>
          )
        })}
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">All Connections</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Broker</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Account</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Sync</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(connections || []).map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.broker_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.account_name || c.account_login || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_live ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      {c.is_live ? 'Live' : 'Demo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_connected ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                      {c.is_connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.last_synced_at ? new Date(c.last_synced_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-destructive truncate max-w-[200px]">
                    {c.last_sync_error || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
