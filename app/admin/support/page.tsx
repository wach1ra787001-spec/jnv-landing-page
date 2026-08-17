import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Headphones, MessageSquare, Bug, Lightbulb, AlertCircle } from 'lucide-react'

const typeIcon: Record<string, any> = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageSquare,
  account: AlertCircle,
}

const statusColor: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-500',
  in_progress: 'bg-blue-500/10 text-blue-400',
  resolved: 'bg-green-500/10 text-green-500',
  closed: 'bg-muted text-muted-foreground',
}

export default async function AdminSupportPage() {
  const supabase = createAdminClient()

  const [{ data: tickets }, { count: openCount }, { count: totalCount }] = await Promise.all([
    supabase.from('feedback')
      .select('id, feedback_type, subject, message, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('feedback').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">User feedback, bug reports, and feature requests</p>
        </div>
        <div className="flex gap-3">
          <Card className="px-4 py-2 bg-card border border-border/50 text-center">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-xl font-bold text-amber-500">{openCount ?? 0}</p>
          </Card>
          <Card className="px-4 py-2 bg-card border border-border/50 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground">{totalCount ?? 0}</p>
          </Card>
        </div>
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">All Tickets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(tickets || []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No tickets yet</td></tr>
              )}
              {(tickets as any[] || []).map(t => {
                const Icon = typeIcon[t.feedback_type] || MessageSquare
                return (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{t.subject || '(No subject)'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.message}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.user_id?.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status] || statusColor.open}`}>
                        {t.status || 'open'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
