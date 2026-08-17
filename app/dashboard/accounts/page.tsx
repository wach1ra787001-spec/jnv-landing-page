'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, ArrowRight, Loader2, Wallet, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Account {
  id: string
  account_name: string
  account_type: string
  currency: string
  initial_balance: number
  created_at: string
  is_active: boolean
}

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    account_name: '',
    account_type: 'Manual',
    currency: 'USD',
    initial_balance: '',
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
        // Set the first account or the one marked as active as selected
        const activeAccount = data.find((acc: Account) => acc.is_active)
        setSelectedAccountId(activeAccount?.id || data[0]?.id || null)
      }
    } catch (error) {
      console.error('[v0] Error fetching accounts:', error)
      toast.error('Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.account_name) {
      toast.error('Please enter an account name')
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: formData.account_name,
          account_type: formData.account_type,
          currency: formData.currency,
          initial_balance: formData.initial_balance ? parseFloat(formData.initial_balance) : null,
        }),
      })

      if (res.ok) {
        const newAccount = await res.json()
        setAccounts([newAccount, ...accounts])
        toast.success('Account created successfully')
        setFormData({ account_name: '', account_type: 'Manual', currency: 'USD', initial_balance: '' })
        setDialogOpen(false)
      } else {
        toast.error('Failed to create account')
      }
    } catch (error) {
      console.error('[v0] Error creating account:', error)
      toast.error('Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Trading Accounts</h1>
          <p className="text-muted-foreground">Manage your trading accounts and track PnL</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>Add a new trading account to start journaling</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Account Name</label>
                <Input
                  placeholder="e.g., Main Account"
                  value={formData.account_name}
                  onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Account Type</label>
                <Select value={formData.account_type} onValueChange={value => setFormData({ ...formData, account_type: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="MT4">MT4</SelectItem>
                    <SelectItem value="cTrader">cTrader</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Currency</label>
                  <Select value={formData.currency} onValueChange={value => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Initial Balance</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.initial_balance}
                    onChange={e => setFormData({ ...formData, initial_balance: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card className="p-12 bg-card border border-border/50 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">No Accounts Yet</h2>
              <p className="text-muted-foreground max-w-md">
                Create your first trading account to start journaling trades and track your performance.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 mt-4">
                  <Plus className="w-4 h-4" />
                  Create First Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Account</DialogTitle>
                  <DialogDescription>Add a new trading account to start journaling</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Account Name</label>
                    <Input
                      placeholder="e.g., Main Account"
                      value={formData.account_name}
                      onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Account Type</label>
                    <Select value={formData.account_type} onValueChange={value => setFormData({ ...formData, account_type: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="MT4">MT4</SelectItem>
                        <SelectItem value="cTrader">cTrader</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">Currency</label>
                      <Select value={formData.currency} onValueChange={value => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Initial Balance</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.initial_balance}
                        onChange={e => setFormData({ ...formData, initial_balance: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => {
            const isSelected = selectedAccountId === account.id
            return (
            <Link key={account.id} href={`/dashboard/accounts/${account.id}`} onClick={() => setSelectedAccountId(account.id)}>
              <Card className={`p-6 bg-card border cursor-pointer transition-all h-full ${
                isSelected
                  ? 'border-primary border-l-4 border-l-primary'
                  : 'border-border hover:border-primary/50'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{account.account_name}</h3>
                      <p className="text-sm text-muted-foreground">{account.account_type}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.is_active
                        ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300'
                    }`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {account.initial_balance && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Initial: {account.currency} {account.initial_balance.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(account.created_at).toLocaleDateString()}
                    </p>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
              </Card>
            </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
