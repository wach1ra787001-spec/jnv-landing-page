import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { ScrollText } from 'lucide-react'

export default async function AdminAuditLogsPage() {
  const supabase = createAdminClient()

  // Use user_sessions as a login audit source + recent role changes from profiles
  const [{ data: sessions }, { data: admins }] = await Promise.all([
    supabase.from('user_sessions')
      .select('id, user_id, logged_in_at, ip_address, browser, os, country, city')
      .order('logged_in_at', { ascending: false })
      .limit(50),
    supabase.from('profiles')
      .select('id, full_name, email, role, updated_at')
      .in('role', ['admin', 'super_admin'])
      .order('updated_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Login history and role assignments</p>
      </div>

      {/* Admin Users */}
      <Card className="border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Admin & Super Admin Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(admins || []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-sm">No admins yet</td></tr>
              )}
              {(admins as any[] || []).map((a) => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{a.full_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                      {a.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Login History */}
      <Card className="border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">Login History (Last 50)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">IP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Browser</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(sessions || []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">No login records</td></tr>
              )}
              {(sessions as any[] || []).map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.user_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.ip_address || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{[s.browser, s.os].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{[s.city, s.country].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.logged_in_at ? new Date(s.logged_in_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
