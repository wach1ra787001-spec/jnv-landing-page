'use client'

import { useState, useEffect } from 'react'
import { Wallet, ChevronDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

interface Account {
  id: string
  account_name: string
  account_type: string
  currency: string
}

export function AccountSelector() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(false)
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data: Account[] = await res.json()
        setAccounts(data)
        if (data.length > 0) {
          setSelectedAccount(data[0])
        }
      }
    } catch (error) {
      console.error('[v0] Error fetching accounts:', error)
    }
  }

  const handleSelectAccount = async (account: Account) => {
    setSelectedAccount(account)
    // Update default_account_id in profiles
    try {
      await fetch(`/api/accounts/${account.id}/set-default`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('[v0] Error setting default account:', error)
    }
  }

  if (loading || accounts.length === 0) {
    return (
      <Link href="/dashboard/accounts">
        <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3 pl-0 flex-shrink-0">
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline ml-2 text-sm">Add Account</span>
        </Button>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 sm:w-auto sm:px-3 pl-0 flex-shrink-0 gap-0"
        >
          <Wallet className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-sm truncate max-w-[120px]">
            {selectedAccount?.account_name || 'Account'}
          </span>
          <ChevronDown className="hidden sm:inline w-4 h-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Trading Accounts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.map(account => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleSelectAccount(account)}
            className="cursor-pointer"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{account.account_name}</p>
              <p className="text-xs text-muted-foreground">{account.account_type} • {account.currency}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <Link href="/dashboard/accounts">
          <DropdownMenuItem className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            <span>Manage Accounts</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
