'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ShieldCheck, Ban, RefreshCw, MonitorDot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminUser {
  id: string
  full_name: string
  email: string
  created_at: string
  subscription_tier: string
  subscription_status: string
  mt5_connected: boolean
  role: string
  is_suspended: boolean
  last_seen: string | null
  total_trades: number
}

interface AdminUsersClientProps {
  users: AdminUser[]
}

const tierColor: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  premium: 'bg-amber-500/10 text-amber-500',
  lifetime: 'bg-purple-500/10 text-purple-400',
}

const roleColor: Record<string, string> = {
  user: 'bg-muted text-muted-foreground',
  admin: 'bg-primary/10 text-primary',
  super_admin: 'bg-purple-500/10 text-purple-400',
}

export function AdminUsersClient({ users }: AdminUsersClientProps) {
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState(users)

  const filtered = localUsers.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSuspend(userId: string) {
    setActionLoading(userId + '-suspend')
    const res = await fetch('/api/admin/users/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason: 'Suspended by admin' }),
    })
    if (res.ok) {
      setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: true } : u))
    }
    setActionLoading(null)
  }

  async function handleReactivate(userId: string) {
    setActionLoading(userId + '-reactivate')
    const res = await fetch('/api/admin/users/reactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: false } : u))
    }
    setActionLoading(null)
  }

  async function handleAssignAdmin(userId: string) {
    setActionLoading(userId + '-role')
    const res = await fetch('/api/admin/users/assign-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roleName: 'admin' }),
    })
    if (res.ok) {
      setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u))
    }
    setActionLoading(null)
  }

  async function handleRemoveAdmin(userId: string) {
    setActionLoading(userId + '-role')
    const res = await fetch('/api/admin/users/assign-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roleName: 'user' }),
    })
    if (res.ok) {
      setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'user' } : u))
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{localUsers.length} total users</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Trades</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">MT5</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Seen</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No users found
                  </td>
                </tr>
              )}
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-[140px]">
                      {user.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tierColor[user.subscription_tier] || tierColor.free)}>
                      {user.subscription_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', roleColor[user.role] || roleColor.user)}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      user.is_suspended
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-green-500/10 text-green-500'
                    )}>
                      {user.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{user.total_trades}</td>
                  <td className="px-4 py-3">
                    <MonitorDot className={cn('w-4 h-4', user.mt5_connected ? 'text-green-500' : 'text-muted-foreground')} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {user.role === 'user' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={actionLoading === user.id + '-role'}
                          onClick={() => handleAssignAdmin(user.id)}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Make Admin
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          disabled={actionLoading === user.id + '-role'}
                          onClick={() => handleRemoveAdmin(user.id)}
                        >
                          Remove Admin
                        </Button>
                      )}
                      {user.is_suspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-green-500 border-green-500/30 hover:bg-green-500/10"
                          disabled={actionLoading === user.id + '-reactivate'}
                          onClick={() => handleReactivate(user.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={actionLoading === user.id + '-suspend'}
                          onClick={() => handleSuspend(user.id)}
                        >
                          <Ban className="w-3 h-3 mr-1" />
                          Suspend
                        </Button>
                      )}
                    </div>
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
