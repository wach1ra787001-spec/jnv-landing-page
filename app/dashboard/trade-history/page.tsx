'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, Search, Loader2, Trash2, Edit2 } from 'lucide-react'
import { appToast } from '@/lib/toast-utils'
import { EditTradeModal } from '@/components/dashboard/edit-trade-modal'
import { useAccount } from '@/components/dashboard/account-context'

interface Trade {
  id: string
  symbol: string
  direction: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  quantity: number
  entryTime: string
  exitTime: string
  pnl: number
  pnlPercent: number
  status: 'closed' | 'open'
  screenshot_urls?: string[]
  notes?: string
  strategy?: string
}

export default function TradeHistoryPage() {
  const router = useRouter()
  const { selectedAccountId } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; tradeId: string | null }>({ show: false, tradeId: null })
  const [deleting, setDeleting] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)

  // Refetch whenever the selected account changes so switching accounts in
  // the header immediately reflects that account's trade history.
  useEffect(() => {
    fetchTrades()
  }, [selectedAccountId])

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades')
      if (response.ok) {
        const data = await response.json()
        // Transform database records to Trade interface
        const formattedTrades = data.map((trade: any) => ({
          id: trade.id,
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice: trade.entry_price || 0,
          exitPrice: trade.exit_price || 0,
          quantity: trade.quantity || 0,
          entryTime: trade.entry_time ? new Date(trade.entry_time).toLocaleString() : 'N/A',
          exitTime: trade.exit_time ? new Date(trade.exit_time).toLocaleString() : 'N/A',
          pnl: trade.pnl || 0,
          pnlPercent: trade.pnl_percent || 0,
          status: trade.status || 'closed',
          screenshot_urls: trade.screenshot_urls || [],
          notes: trade.notes || '',
          strategy: trade.strategy || '',
        }))
        setTrades(formattedTrades)
      }
    } catch (error) {
      console.error('[v0] Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrade = async () => {
    if (!deleteConfirm.tradeId) return
    
    try {
      setDeleting(true)
      const response = await fetch(`/api/trades/${deleteConfirm.tradeId}`, { method: 'DELETE' })
      
      if (response.ok) {
        setTrades(trades.filter(t => t.id !== deleteConfirm.tradeId))
        appToast.tradeSaved('', '0', '0', true, 'Trade deleted successfully')
        setDeleteConfirm({ show: false, tradeId: null })
      } else {
        appToast.tradeSaveFailed()
      }
    } catch (error) {
      console.error('[v0] Error deleting trade:', error)
      appToast.tradeSaveFailed()
    } finally {
      setDeleting(false)
    }
  }

  const filteredTrades = trades.filter(
    (trade) =>
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.direction.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0)
  const winRate = trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading trade history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-2">Total Trades</div>
          <div className="text-3xl font-bold text-foreground">{trades.length}</div>
          <div className="text-xs text-muted-foreground mt-2">All closed trades</div>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-2">Total P&L</div>
          <div className={cn('text-3xl font-bold', totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            ${totalPnL.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">Net profit/loss</div>
        </Card>
        <Card className="p-6 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
          <div className="text-3xl font-bold text-foreground">{winRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-2">{trades.filter(t => t.pnl > 0).length} winning trades</div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by symbol or direction..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card border-border text-foreground"
        />
      </div>

      {/* Empty State */}
      {trades.length === 0 && (
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-muted-foreground mb-4">No trades yet</p>
          <Button onClick={() => router.push('/dashboard/trade-journal')}>
            Log Your First Trade
          </Button>
        </Card>
      )}

      {/* Trades Table */}
      {trades.length > 0 && (
        <Card className="overflow-hidden bg-card border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Direction</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Entry Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Exit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Exit Time</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">P&L</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/trade-detail/${trade.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-foreground">{trade.symbol}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trade.direction === 'long' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={cn(
                          'font-medium uppercase text-sm',
                          trade.direction === 'long'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}>
                          {trade.direction === 'long' ? 'BUY' : 'SELL'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{trade.entryPrice.toFixed(4)}</td>
                    <td className="px-6 py-4 text-foreground">{trade.exitPrice.toFixed(4)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{trade.exitTime}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={cn(
                        'font-semibold',
                        trade.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        ${trade.pnl.toFixed(2)}
                      </div>
                      <div className={cn(
                        'text-xs',
                        trade.pnlPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTrade(trade)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/trade-detail/${trade.id}`)
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm({ show: true, tradeId: trade.id })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Trade Modal */}
      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onUpdate={(updatedTrade) => {
            setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t))
            appToast.tradeSaved(updatedTrade.symbol, updatedTrade.pnl.toFixed(2), updatedTrade.pnlPercent.toFixed(2), updatedTrade.pnl >= 0)
            setEditingTrade(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-card border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Trade</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this trade? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm({ show: false, tradeId: null })}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTrade}
                disabled={deleting}
                className="gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Trade
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
