'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyEntry {
  id: string
  date: string
  trades: any[]
  pnl: number
  winRate: number
  isMissedOpportunity: boolean
}

export default function DailyJournalPage() {
  const router = useRouter()
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDailyEntries()
  }, [])

  const fetchDailyEntries = async () => {
    try {
      const response = await fetch('/api/trades')
      if (response.ok) {
        const trades = await response.json()
        
        // Group trades by date
        const groupedByDate = trades.reduce((acc: any, trade: any) => {
          const date = new Date(trade.entry_time).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          
          if (!acc[date]) {
            acc[date] = {
              trades: [],
              pnl: 0,
              wins: 0,
            }
          }
          
          acc[date].trades.push(trade)
          acc[date].pnl += trade.pnl || 0
          if (trade.pnl > 0) acc[date].wins += 1
          
          return acc
        }, {})

        // Convert to array format
        const entries = Object.entries(groupedByDate).map(([date, data]: any) => ({
          id: date,
          date,
          trades: data.trades,
          pnl: data.pnl,
          winRate: data.trades.length > 0 ? (data.wins / data.trades.length) * 100 : 0,
          isMissedOpportunity: false,
        }))

        setDailyEntries(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      }
    } catch (error) {
      console.error('[v0] Error fetching daily entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMissedTrade = () => {
    router.push('/dashboard/trade-journal')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading daily journal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Daily Journal</h1>
          <p className="text-muted-foreground">Review your trading behavior and daily performance.</p>
        </div>
        
        <Button
          onClick={handleAddMissedTrade}
          className="bg-[#2674D9] hover:bg-[#1f5ab3] text-white"
          style={{ width: '100px', height: '40px', borderRadius: '8px' }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Missed Trade
        </Button>
      </div>

      {/* Daily Cards Grid - 4 columns, 10 rows */}
      {dailyEntries.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {dailyEntries.slice(0, 40).map((entry) => (
            <div
              key={entry.id}
              onClick={() => router.push(`/dashboard/daily-journal/${entry.id}`)}
              className={cn(
                'p-5 rounded-lg cursor-pointer transition-all border',
                entry.isMissedOpportunity
                  ? 'bg-[rgb(30,41,59)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(38,116,217,0.12)]'
                  : 'bg-[rgb(30,41,59)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(38,116,217,0.12)] hover:bg-[rgba(38,116,217,0.08)]'
              )}
            >
              {/* Top Left - Date and PnL */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-foreground mb-2">{entry.date}</div>
                <div className={cn(
                  'text-xl font-bold',
                  entry.pnl > 0 ? 'text-green-400' : entry.pnl < 0 ? 'text-red-400' : 'text-gray-400'
                )}>
                  {entry.pnl > 0 ? '+' : ''}{entry.pnl.toFixed(2)}
                </div>
              </div>

              {/* Middle Section - Trade Summary */}
              <div className="space-y-2 mb-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Symbols: </span>
                  <span className="text-foreground">
                    {entry.trades.length > 0 
                      ? [...new Set(entry.trades.map(t => t.symbol))].join(', ')
                      : 'N/A'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">RR: </span>
                  <span className="text-foreground">-</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Result: </span>
                  <span className={cn(
                    'font-semibold',
                    entry.pnl > 0 ? 'text-green-400' : entry.pnl < 0 ? 'text-red-400' : 'text-yellow-400'
                  )}>
                    {entry.pnl > 0 ? 'WIN' : entry.pnl < 0 ? 'LOSS' : 'BE'}
                  </span>
                </div>
              </div>

              {/* Top Right - Review Button */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <span className="text-xs text-muted-foreground">{entry.trades.length} trades</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 border-[#2674D9] text-[#2674D9] hover:bg-[rgba(38,116,217,0.1)]"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/dashboard/daily-review/${entry.id}`)
                  }}
                >
                  Review
                </Button>
              </div>

              {/* Missed Opportunity Badge */}
              {entry.isMissedOpportunity && (
                <div className="mt-3 px-2 py-1 bg-gray-600 text-white text-xs rounded text-center">
                  MISSED OPPORTUNITY
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12 bg-card border border-border/50 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              📅
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">No Daily Entries Yet</h2>
              <p className="text-muted-foreground max-w-md">
                Start logging trades to see your daily performance analysis here.
              </p>
            </div>
            <Button onClick={handleAddMissedTrade} className="gap-2 bg-primary hover:bg-primary/90 mt-4">
              <Plus className="w-4 h-4" />
              Add Your First Trade
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
