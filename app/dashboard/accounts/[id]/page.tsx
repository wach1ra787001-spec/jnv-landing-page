'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2, Trash2, DollarSign, TrendingUp, Target, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Account {
  id: string
  account_name: string
  account_type: string
  currency: string
  initial_balance: number
  created_at: string
  is_active: boolean
}

interface PnLData {
  account_id: string
  total_pnl: number
  winning_trades: number
  losing_trades: number
  total_trades: number
  win_rate: number
  initial_balance: number
}

export default function AccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string

  const [account, setAccount] = useState<Account | null>(null)
  const [pnlData, setPnlData] = useState<PnLData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAccountData()
  }, [accountId])

  const fetchAccountData = async () => {
    try {
      setLoading(true)
      const [accountRes, pnlRes] = await Promise.all([
        fetch(`/api/accounts/${accountId}`),
        fetch(`/api/accounts/${accountId}/pnl`),
      ])

      if (accountRes.ok) {
        const accountData = await accountRes.json()
        setAccount(accountData)
      }

      if (pnlRes.ok) {
        const pnlDataResult = await pnlRes.json()
        setPnlData(pnlDataResult)
      }
    } catch (error) {
      console.error('[v0] Error fetching account data:', error)
      toast.error('Failed to load account')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Account deleted')
        router.push('/dashboard/accounts')
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      console.error('[v0] Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Account not found</p>
        <Link href="/dashboard/accounts">
          <Button variant="outline">Back to Accounts</Button>
        </Link>
      </div>
    )
  }

  const chartData = [
    { month: 'Jan', pnl: 0 },
    { month: 'Feb', pnl: pnlData?.total_pnl || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounts">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{account.account_name}</h1>
            <p className="text-muted-foreground text-sm">
              {account.account_type} • {account.currency} • Created {new Date(account.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {account.account_name} and remove all associated trades.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total PnL</p>
              <p className={`text-2xl font-bold ${(pnlData?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {account.currency} {(pnlData?.total_pnl || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${(pnlData?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-foreground">{pnlData?.total_trades || 0}</p>
            </div>
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-foreground">{(pnlData?.win_rate || 0).toFixed(1)}%</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">W</div>
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Wins / Losses</p>
              <p className="text-2xl font-bold text-foreground">
                <span className="text-green-600">{pnlData?.winning_trades || 0}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-red-600">{pnlData?.losing_trades || 0}</span>
              </p>
            </div>
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* PnL Chart */}
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">PnL Progress</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              labelStyle={{ color: 'var(--color-foreground)' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="pnl" 
              stroke="var(--color-primary)" 
              dot={{ fill: 'var(--color-primary)' }}
              name="Total PnL"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Account Info */}
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Account Type</p>
            <p className="text-foreground font-medium">{account.account_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Currency</p>
            <p className="text-foreground font-medium">{account.currency}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Initial Balance</p>
            <p className="text-foreground font-medium">{account.currency} {(account.initial_balance || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date Added</p>
            <p className="text-foreground font-medium">{new Date(account.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
