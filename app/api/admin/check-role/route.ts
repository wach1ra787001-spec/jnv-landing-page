import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user) {
      return NextResponse.json({ isAdmin: false, isSuperAdmin: false })
    }

    const userId = authData.user.id

    // Query profiles table for user role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return NextResponse.json({ isAdmin: false, isSuperAdmin: false })
    }

    const role = profile.role
    const isSuperAdmin = role === 'super_admin'
    const isAdmin = role === 'admin' || role === 'super_admin'

    return NextResponse.json({ isAdmin, isSuperAdmin })
  } catch (e) {
    console.error('[v0] Check role error:', e)
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false })
  }
}
