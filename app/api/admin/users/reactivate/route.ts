import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/rbac/route-guards'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('user_suspension')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin API] Error reactivating user:', error)
    return NextResponse.json({ error: 'Failed to reactivate user' }, { status: 500 })
  }
}
