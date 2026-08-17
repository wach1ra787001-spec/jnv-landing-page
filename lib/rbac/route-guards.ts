import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: suspension }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).single(),
    supabase.from('user_suspension').select('is_active').eq('user_id', userId).eq('is_active', true).single(),
  ])
  return { role: profile?.role, is_suspended: !!suspension }
}

/**
 * Guard for admin-only API routes (admin or super_admin)
 */
export async function requireAdmin(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      return { authorized: false, error: 'Not authenticated' }
    }

    const profile = await getUserProfile(authData.user.id)
    if (profile?.is_suspended) {
      return { authorized: false, error: 'User is suspended' }
    }
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return { authorized: false, error: 'Admin access required' }
    }

    return { authorized: true, userId: authData.user.id }
  } catch (error) {
    return { authorized: false, error: 'Authorization failed' }
  }
}

/**
 * Guard for super_admin-only API routes
 */
export async function requireSuperAdmin(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      return { authorized: false, error: 'Not authenticated' }
    }

    const profile = await getUserProfile(authData.user.id)
    if (profile?.is_suspended) {
      return { authorized: false, error: 'User is suspended' }
    }
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return { authorized: false, error: 'Super admin access required' }
    }

    return { authorized: true, userId: authData.user.id }
  } catch (error) {
    return { authorized: false, error: 'Authorization failed' }
  }
}

/**
 * Guard for authenticated users (checks suspension)
 */
export async function requireAuth(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      return { authorized: false, error: 'Not authenticated' }
    }

    const profile = await getUserProfile(authData.user.id)
    if (profile?.is_suspended) {
      return { authorized: false, error: 'User is suspended' }
    }

    return { authorized: true, userId: authData.user.id }
  } catch (error) {
    return { authorized: false, error: 'Authentication check failed' }
  }
}

/**
 * Helper to return unauthorized response
 */
export function unauthorizedResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Helper to return authentication error response
 */
export function unauthenticatedResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 401 })
}
