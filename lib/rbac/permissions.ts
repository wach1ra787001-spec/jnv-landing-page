import { createClient } from '@/lib/supabase/server'

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('[RBAC] hasRole error:', error)
      return false
    }

    return profile.role === roleName
  } catch (error) {
    console.error('[RBAC] hasRole exception:', error)
    return false
  }
}

/**
 * Check if user is suspended
 */
export async function isUserSuspended(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('is_user_suspended', {
      user_id: userId,
    })

    if (error) {
      console.error('[RBAC] isUserSuspended error:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('[RBAC] isUserSuspended exception:', error)
    return false
  }
}

/**
 * Get user role from profiles
 */
export async function getUserRole(userId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('[RBAC] getUserRole error:', error)
      return 'user' // fallback to user role
    }

    return profile.role || 'user'
  } catch (error) {
    console.error('[RBAC] getUserRole exception:', error)
    return 'user'
  }
}

/**
 * Check if user is admin or super_admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const isAdminRole = await hasRole(userId, 'admin')
  const isSuperAdmin = await hasRole(userId, 'super_admin')
  return isAdminRole || isSuperAdmin
}

/**
 * Check if user is super_admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'super_admin')
}

/**
 * Assign a role to a user (admin only)
 */
export async function assignRoleToUser(
  targetUserId: string,
  roleName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Validate role name
    const validRoles = ['user', 'admin', 'super_admin']
    if (!validRoles.includes(roleName)) {
      return { success: false, error: `Invalid role: ${roleName}` }
    }

    // Update user role in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: roleName })
      .eq('id', targetUserId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Remove admin role from a user (resets to 'user' role)
 */
export async function removeRoleFromUser(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Reset user role to 'user'
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', targetUserId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Suspend a user (super_admin only)
 */
export async function suspendUser(
  targetUserId: string,
  reason: string,
  until?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('user_suspension').insert({
      user_id: targetUserId,
      suspended_by: (await supabase.auth.getUser()).data.user?.id,
      reason,
      until: until || null,
      is_active: true,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Reactivate a suspended user (super_admin only)
 */
export async function reactivateUser(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('user_suspension')
      .update({ is_active: false })
      .eq('user_id', targetUserId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
