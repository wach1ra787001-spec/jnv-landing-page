'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdmin, isSuperAdmin } from '@/lib/rbac/permissions'

interface AdminOnlyProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'super_admin'
}

/**
 * Renders children only if user has admin or higher role
 */
export function AdminOnly({ children, requiredRole = 'admin' }: AdminOnlyProps) {
  const supabase = createClient()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      if (requiredRole === 'super_admin') {
        const superAdmin = await isSuperAdmin(authData.user.id)
        setHasAccess(superAdmin)
      } else {
        const admin = await isAdmin(authData.user.id)
        setHasAccess(admin)
      }
    } catch (error) {
      setHasAccess(false)
    }
  }

  return hasAccess ? <>{children}</> : null
}
