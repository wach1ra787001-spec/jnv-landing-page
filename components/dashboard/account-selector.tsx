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
      <Link
        href="/dashboard/settings/broker"
        className="inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 sm:text-sm"
        aria-label="Connect using MT5, cTrader, or four more account methods"
      >
        <img src="/images/mt5-logo.png" alt="" className="size-4 rounded-sm object-cover" />
        <img src="/images/ctrader-logo.png" alt="" className="size-4 rounded-sm object-cover" />
        <Plus className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Connect using MT5, cTrader +4 more methods</span>
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
        <Link href="/dashboard/settings/broker">
          <DropdownMenuItem className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            <span>Manage Accounts</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/settings/broker" className="flex items-center gap-1.5">
            <img src="/images/mt5-logo.png" alt="" className="size-4 rounded-sm object-cover" />
            <img src="/images/ctrader-logo.png" alt="" className="size-4 rounded-sm object-cover" />
            <Plus className="size-3.5 shrink-0" aria-hidden="true" />
            <span>Connect using MT5, cTrader +4 more methods</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
