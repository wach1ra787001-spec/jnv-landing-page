import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

const statusColor: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  trialing: 'bg-blue-500/10 text-blue-400',
  past_due: 'bg-amber-500/10 text-amber-500',
  canceled: 'bg-destructive/10 text-destructive',
  inactive: 'bg-muted text-muted-foreground',
}

const tierColor: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  premium: 'bg-amber-500/10 text-amber-500',
  lifetime: 'bg-purple-500/10 text-purple-400',
}

export default async function AdminSubscriptionsPage() {
  const supabase = createAdminClient()

  const [{ data: profiles }, { count: activeCount }, { count: trialingCount }] = await Promise.all([
    supabase.from('profiles')
      .select('id, full_name, email, subscription_tier, subscription_status, created_at, stripe_customer_id')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trialing'),
  ])

  // Count by tier
  const tierMap: Record<string, number> = {}
  for (const p of profiles || []) {
    const tier = (p as any).subscription_tier || 'free'
    tierMap[tier] = (tierMap[tier] || 0) + 1
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Active plans, trials, and billing status</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(tierMap).map(([tier, count]) => (
          <Card key={tier} className="p-4 bg-card border border-border/50">
            <p className="text-xs text-muted-foreground capitalize mb-1">{tier}</p>
            <p className="text-2xl font-bold text-foreground">{count}</p>
          </Card>
        ))}
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">All Subscriptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Stripe ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(profiles as any[] || []).map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-[140px]">{p.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColor[p.subscription_tier] || tierColor.free}`}>
                      {p.subscription_tier || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.subscription_status] || statusColor.inactive}`}>
                      {p.subscription_status || 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.stripe_customer_id || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
