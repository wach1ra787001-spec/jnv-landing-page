
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verify authenticated user
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    redirect('/auth/login')
  }

  // Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  const role = profile.role

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/dashboard')
  }

  const isSuperAdmin = role === 'super_admin'

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-background"
      style={{
        padding: '20px',
        gap: '20px',
      }}
    >
      {/* Admin Sidebar */}
      <div
        className="flex-shrink-0 rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          transition: 'width 250ms ease, box-shadow 250ms ease',
        }}
      >
        <AdminSidebar isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Admin Content */}
      <main
        className="flex-1 min-w-0 overflow-y-auto rounded-2xl bg-card"
        style={{
          padding: '28px',
          boxShadow: '0 10px 35px rgba(0,0,0,0.08)',
          transition: 'all 250ms ease',
        }}
      >
        {children}
      </main>
    </div>
  )
}
