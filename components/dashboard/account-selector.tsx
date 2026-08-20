'use client'

import { Wallet, ChevronDown, Plus, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAccount } from '@/components/dashboard/account-context'

export function AccountSelector() {
  const { accounts, selectedAccount, isSwitching, switchAccount } = useAccount()

  if (accounts.length === 0) {
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
          disabled={isSwitching}
          className="h-9 w-9 sm:w-auto sm:px-3 pl-0 flex-shrink-0 gap-0"
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4 flex-shrink-0" />
          )}
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
            onClick={() => switchAccount(account.id)}
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
