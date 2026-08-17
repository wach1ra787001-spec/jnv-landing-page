import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { ShieldCheck, User, Crown } from 'lucide-react'

const ROLES = [
  {
    name: 'user',
    description: 'Standard user — can access their own trading data and AI features.',
    icon: User,
    color: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
  },
  {
    name: 'admin',
    description: 'Admin access — can manage users, view analytics, and moderate content.',
    icon: ShieldCheck,
    color: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  },
  {
    name: 'super_admin',
    description: 'Full system access — can manage all users, roles, and platform settings.',
    icon: Crown,
    color: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-400',
  },
]

export default async function AdminRolesPage() {
  const supabase = createAdminClient()

  // Fetch all users with elevated roles from profiles
  const { data: elevatedUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, updated_at')
    .in('role', ['admin', 'super_admin'])
    .order('role', { ascending: true })

  // Count users per role
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('role')

  const roleCounts: Record<string, number> = { user: 0, admin: 0, super_admin: 0 }
  for (const p of allProfiles || []) {
    const r = (p as any).role || 'user'
    roleCounts[r] = (roleCounts[r] || 0) + 1
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Roles &amp; Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Roles are stored on the profiles table. Assign roles from the Users page.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ROLES.map(r => {
          const Icon = r.icon
          return (
            <Card key={r.name} className="p-4 bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${r.color}`} />
                <span className="font-semibold text-foreground text-sm">{r.name}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${r.badge}`}>
                  {roleCounts[r.name] ?? 0} users
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </Card>
          )
        })}
      </div>

      {/* Elevated users table */}
      <Card className="border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Admin &amp; Super Admin Users</h3>
          <p className="text-xs text-muted-foreground mt-0.5">To change a role, go to the Users page and use the role action buttons.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(elevatedUsers || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No admin users yet. Assign roles from the Users page.
                  </td>
                </tr>
              )}
              {(elevatedUsers as any[] || []).map(u => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'super_admin'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}
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
