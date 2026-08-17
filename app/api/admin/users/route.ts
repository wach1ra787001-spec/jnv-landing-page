import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/rbac/route-guards'

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 })
  }

  try {
    const supabase = await createClient()

    // Get all users with their roles and suspension status
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, created_at')

    if (usersError) throw usersError

    // Fetch roles and suspension status for each user
    const usersWithRoles = await Promise.all(
      (users || []).map(async (user) => {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id)

        const { data: suspension } = await supabase
          .from('user_suspension')
          .select('is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        return {
          id: user.id,
          email: user.email,
          roles: userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [],
          created_at: user.created_at,
          is_suspended: !!suspension,
        }
      })
    )

    return NextResponse.json(usersWithRoles)
  } catch (error) {
    console.error('[Admin API] Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
