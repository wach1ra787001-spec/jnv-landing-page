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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3 pl-0 flex-shrink-0">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline ml-2 text-sm">Add Account</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/dashboard/accounts"><Wallet className="mr-2 size-4" />Add Manual Account</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Other methods of adding an account</DropdownMenuLabel>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/dashboard/settings?tab=broker&method=mt5"><img src="https://thesvg.org/icons/metatrader-5/default.svg" alt="" className="mr-2 size-4" />Connect MT5</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/api/ctrader/auth"><img src="https://thesvg.org/icons/ctrader/default.svg" alt="" className="mr-2 size-4" />Connect cTrader</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/dashboard/accounts"><Plus className="mr-2 size-4" />More account methods</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Other methods of adding an account</DropdownMenuLabel>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/settings?tab=broker&method=mt5">
            <img src="https://thesvg.org/icons/metatrader-5/default.svg" alt="" className="mr-2 size-4" />
            <span>Connect MT5</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/api/ctrader/auth">
            <img src="https://thesvg.org/icons/ctrader/default.svg" alt="" className="mr-2 size-4" />
            <span>Connect cTrader</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/accounts">
            <Plus className="mr-2 size-4" />
            <span>More account methods</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
