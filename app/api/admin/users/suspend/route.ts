import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/rbac/route-guards'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 })
  }

  try {
    const { userId, reason } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('user_suspension')
      .upsert({
        user_id: userId,
        suspended_by: authCheck.userId,
        reason: reason || 'Suspended by administrator',
        is_active: true,
      }, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin API] Error suspending user:', error)
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
  }
}
