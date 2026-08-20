'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface TradingAccount {
  id: string
  account_name: string
  account_type: string
  currency: string
}

interface AccountContextValue {
  accounts: TradingAccount[]
  selectedAccountId: string | null
  selectedAccount: TradingAccount | null
  isSwitching: boolean
  switchAccount: (accountId: string) => Promise<void>
  refreshAccounts: () => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function AccountProvider({
  children,
  initialAccounts,
  initialSelectedAccountId,
}: {
  children: React.ReactNode
  initialAccounts: TradingAccount[]
  initialSelectedAccountId: string | null
}) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<TradingAccount[]>(initialAccounts)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(initialSelectedAccountId)
  const [isSwitching, setIsSwitching] = useState(false)

  const refreshAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data: TradingAccount[] = await res.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('[v0] Error refreshing accounts:', error)
    }
  }, [])

  const switchAccount = useCallback(
    async (accountId: string) => {
      if (accountId === selectedAccountId) return

      // Optimistically flip the selection so client components (which read
      // selectedAccountId directly) refetch immediately.
      setSelectedAccountId(accountId)
      setIsSwitching(true)

      try {
        await fetch(`/api/accounts/${accountId}/set-default`, { method: 'POST' })
      } catch (error) {
        console.error('[v0] Error switching account:', error)
      } finally {
        // Re-run server components (dashboard home, advanced stats, etc.)
        // now that the selection cookie has been written.
        router.refresh()
        setIsSwitching(false)
      }
    },
    [selectedAccountId, router],
  )

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  )

  const value = useMemo<AccountContextValue>(
    () => ({ accounts, selectedAccountId, selectedAccount, isSwitching, switchAccount, refreshAccounts }),
    [accounts, selectedAccountId, selectedAccount, isSwitching, switchAccount, refreshAccounts],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return context
}
