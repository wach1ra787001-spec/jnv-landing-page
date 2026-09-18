'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, AlertTriangle, FileSpreadsheet, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getPendingImportedTrades, type PendingImportedTrade } from '@/lib/pending-imports'

export default function JournalPage() {
  const router = useRouter()
  const [pendingTrades, setPendingTrades] = useState<PendingImportedTrade[]>([])

  useEffect(() => {
    setPendingTrades(getPendingImportedTrades())
  }, [])

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/50 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Trade Journal</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Log your trades here</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/dashboard/journal/missed" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2 sm:w-auto" size="sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Journal a Missed Trade</span>
              </Button>
            </Link>
            <Link href="/dashboard/journal/new" className="w-full sm:w-auto">
              <Button
                className="w-full gap-2 bg-[#0A1F44] hover:bg-[#071530] text-white sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Trade</span>
                <span className="sm:hidden">Add a New Trade</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Imported trades awaiting journaling */}
      {pendingTrades.length > 0 && (
        <Card className="border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                Imported Trades from {pendingTrades[0]?.source_label || 'CSV'} ({pendingTrades.length})
              </h2>
            </div>
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700">
              Needs strategy to save
            </Badge>
          </div>
          <p className="px-4 pt-3 text-xs sm:text-sm text-muted-foreground">
            Complete each trade below with a strategy, notes, and screenshots before it is saved to Trade History.
          </p>
          <div className="divide-y divide-amber-500/10">
            {pendingTrades.map((trade, index) => {
              const isWin = (trade.pnl ?? 0) >= 0
              return (
                <button
                  key={`${trade.external_ref || trade.symbol}-${index}`}
                  type="button"
                  onClick={() => router.push(`/dashboard/journal/new?importIndex=${index}`)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-500/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${trade.direction === 'short' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {trade.direction === 'short' ? 'SHORT' : 'LONG'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-foreground truncate">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {trade.open_time ? new Date(trade.open_time as string).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-semibold ${isWin ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isWin ? '+' : ''}{(trade.pnl ?? 0).toFixed(2)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Navigation to Trade History */}
      <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">View Your Saved Trades</h3>
            <p className="text-muted-foreground">All trades you log here will be saved and visible in your Trade History page.</p>
          </div>
          <Link href="/dashboard/trade-history">
            <Button className="gap-2">
              Go to Trade History
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
