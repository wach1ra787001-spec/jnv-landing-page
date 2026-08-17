'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/rbac/permissions'

interface AdminRouteGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'super_admin'
}

export function AdminRouteGuard({
  children,
  requiredRole = 'admin',
}: AdminRouteGuardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    try {
      const { data: authData } = await supabase.auth.getUser()

      if (!authData.user) {
        router.push('/auth/login')
        return
      }

      const admin = await isAdmin(authData.user.id)
      if (!admin) {
        router.push('/dashboard')
        return
      }

      setIsAuthorized(true)
    } catch (error) {
      router.push('/dashboard')
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
