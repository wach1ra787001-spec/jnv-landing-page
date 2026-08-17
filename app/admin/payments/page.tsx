import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Banknote } from 'lucide-react'

export default async function AdminPaymentsPage() {
  const supabase = createAdminClient()

  // Use profiles with stripe data as a proxy — a real implementation would use Stripe webhooks table
  const { data: paying } = await supabase
    .from('profiles')
    .select('id, full_name, email, subscription_tier, subscription_status, stripe_customer_id, created_at')
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Stripe customers and billing records</p>
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Banknote className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Stripe Customers ({paying?.length ?? 0})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Stripe Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(paying || []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No Stripe customers yet</td></tr>
              )}
              {(paying as any[] || []).map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground capitalize">{p.subscription_tier}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.subscription_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      {p.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.stripe_customer_id}</td>
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
