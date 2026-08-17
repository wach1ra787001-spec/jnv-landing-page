import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/rbac/route-guards'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 })
  }

  try {
    const { userId, roleName } = await request.json()

    if (!userId || !roleName) {
      return NextResponse.json(
        { error: 'userId and roleName are required' },
        { status: 400 }
      )
    }

    const validRoles = ['user', 'admin', 'super_admin']
    if (!validRoles.includes(roleName)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Update role directly on profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: roleName })
      .eq('id', userId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin API] Error assigning role:', error)
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    )
  }
}
