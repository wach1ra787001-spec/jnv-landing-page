import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

export default async function AdminUsersPage() {
  const supabase = createAdminClient()

  // Fetch all profiles including role column + suspensions separately
  const [{ data: profiles }, { data: sessions }, { data: tradeCounts }, { data: suspensions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at, subscription_tier, subscription_status, mt5_connected, role')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_sessions')
      .select('user_id, last_seen_at')
      .order('last_seen_at', { ascending: false }),
    supabase
      .from('account_stats')
      .select('user_id, total_trades'),
    supabase
      .from('user_suspension')
      .select('user_id')
      .eq('is_active', true),
  ])

  const suspensionSet = new Set((suspensions || []).map((s: any) => s.user_id))

  // Build last seen map
  const lastSeenMap: Record<string, string> = {}
  for (const s of sessions || []) {
    if (!lastSeenMap[s.user_id]) lastSeenMap[s.user_id] = s.last_seen_at
  }

  // Build trade count map
  const tradeCountMap: Record<string, number> = {}
  for (const t of tradeCounts || []) {
    tradeCountMap[t.user_id] = Number(t.total_trades) || 0
  }

  const users = (profiles || []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name || '',
    email: p.email || '',
    created_at: p.created_at,
    subscription_tier: p.subscription_tier || 'free',
    subscription_status: p.subscription_status || 'inactive',
    mt5_connected: p.mt5_connected || false,
    role: p.role || 'user',
    is_suspended: suspensionSet.has(p.id),
    last_seen: lastSeenMap[p.id] || null,
    total_trades: tradeCountMap[p.id] || 0,
  }))

  return <AdminUsersClient users={users} />
}
