'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OpenPositionEnriched } from '@/types/positions'

interface OpenPositionsWidgetProps {
  userId: string
  currency?: string
  accountId?: string | null
}

export function OpenPositionsWidget({ userId, currency = 'USD', accountId }: OpenPositionsWidgetProps) {
  const [positions, setPositions] = useState<OpenPositionEnriched[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  const fetchPositions = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({ userId })
      if (accountId) params.set('accountId', accountId)

      const response = await fetch(`/api/open-positions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPositions(data)
        setLastSynced(new Date())
      }
    } catch (error) {
      console.error('[v0] Error fetching positions:', error)
    } finally {
      if (showRefreshing) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    fetchPositions()
    
    // Poll every 30 seconds
    const interval = setInterval(() => fetchPositions(true), 30000)
    return () => clearInterval(interval)
  }, [userId, accountId])

  const handleRefresh = () => {
    fetchPositions(true)
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <Card className="p-6 bg-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Open Positions</h3>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border border-border/50 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">Open Positions</h3>
          <div className="bg-muted px-2 py-1 rounded text-xs font-medium text-foreground">
            {positions.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && (
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Updated {getTimeAgo(lastSynced)}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground space-y-2">
            <div className="text-sm font-medium">No open positions</div>
            <div className="text-xs text-muted-foreground">
              Connect your broker to see live positions
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-2 font-semibold text-foreground">Symbol</th>
                <th className="text-left py-3 px-2 font-semibold text-foreground">Direction</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground">Volume</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground">Entry</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground">Current</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground">Float P&L</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground">SL</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground">TP</th>
                <th className="text-left py-3 px-2 font-semibold text-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr
                  key={position.id}
                  className={cn(
                    'border-b border-border/30 hover:bg-muted/50 transition-colors',
                    position.is_in_profit ? 'bg-green-50/30 dark:bg-green-950/20' : 'bg-red-50/30 dark:bg-red-950/20'
                  )}
                >
                  <td className="py-3 px-2 font-medium text-foreground">{position.symbol}</td>
                  <td className="py-3 px-2">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-semibold',
                        position.direction === 'long'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      )}
                    >
                      {position.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">{position.volume.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right text-foreground">{position.entry_price.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {position.current_price ? position.current_price.toFixed(2) : '-'}
                  </td>
                  <td
                    className={cn(
                      'py-3 px-2 text-right font-semibold',
                      position.is_in_profit
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {position.net_floating_pnl ? `${position.net_floating_pnl > 0 ? '+' : ''}${position.net_floating_pnl.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {position.stop_loss ? position.stop_loss.toFixed(2) : '-'}
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">
                    {position.take_profit ? position.take_profit.toFixed(2) : '-'}
                  </td>
                  <td className="py-3 px-2 text-left text-muted-foreground text-xs">
                    {position.time_open_display}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
