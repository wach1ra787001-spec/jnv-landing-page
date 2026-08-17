'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AccountRequiredPrompt() {
  const [hasAccounts, setHasAccounts] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccounts()
  }, [])

  const checkAccounts = async () => {
    try {
      const res = await fetch('/api/accounts/check')
      if (res.ok) {
        const data = await res.json()
        setHasAccounts(data.hasAccounts)
      }
    } catch (error) {
      console.error('[v0] Error checking accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || hasAccounts) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>No Trading Account</AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span>You must create a trading account before you can start journaling trades.</span>
        <Link href="/dashboard/accounts">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Account
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
