'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, SlidersHorizontal, Search, X, Bell } from 'lucide-react'
import { appToast } from '@/lib/toast-utils'
import { TradeModal } from '@/components/dashboard/trade-modal'
import { TradeJournalEntryCard } from '@/components/journal/trade-journal-entry-card'
import { useAccount } from '@/components/dashboard/account-context'

interface Trade {
  id: string
  symbol: string
  direction: 'long' | 'short'
  entry_price: number
  exit_price: number | null
  lot_size: number
  quantity: number
  pnl: number
  net_pnl: number
  entry_time: string
  exit_time: string | null
  status: string
  source: string
  screenshot_urls?: string[]
  strategy?: string
  setup_type?: string
  created_at: string
}

type FilterSource = 'all' | 'csv' | 'manual' | 'mt5' | 'ctrader'

export default function TradeJournalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const { selectedAccountId } = useAccount()

  const [showModal, setShowModal] = useState(false)
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [search, setSearch] = useState('')
  const [showImportBanner, setShowImportBanner] = useState(false)
  const [newImportCount, setNewImportCount] = useState(0)

  // ── Fetch trades ────────────────────────────────────────────────────────────
  // Refetches whenever the selected account changes so switching accounts in
  // the header immediately reflects that account's trades.
  useEffect(() => {
    fetchTrades()
  }, [selectedAccountId])

  // Check for newly imported CSV trades (imported in the last 10 minutes)
  useEffect(() => {
    if (trades.length === 0) return
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentImports = trades.filter(
      t => t.source === 'csv' && new Date(t.created_at) > tenMinutesAgo
    )
    if (recentImports.length > 0) {
      setNewImportCount(recentImports.length)
      setShowImportBanner(true)
    }
  }, [trades])

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trades')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      // Sort newest first
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a: Trade, b: Trade) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setTrades(sorted)
    } catch {
      appToast.error('Failed to load trades')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTrade = async (tradeData: any) => {
    try {
      const sanitizedData = {
        ...tradeData,
        direction: String(tradeData.direction || 'buy').toLowerCase(),
        symbol: String(tradeData.symbol || '').toUpperCase().trim(),
        source: 'manual',
      }

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      })

      if (response.ok) {
        const result = await response.json()
        appToast.tradeSaved(result.symbol, result.pnl?.toFixed(2), '', result.pnl >= 0)
        setShowModal(false)
        fetchTrades()
      } else {
        const errorBody = await response.json().catch(() => null)
        console.error('[v0] Trade save failed:', response.status, errorBody)
        appToast.tradeSaveFailed(errorBody?.error || errorBody?.details || 'Unable to save trade')
      }
    } catch (error) {
      console.error('[v0] Trade save request failed:', error)
      appToast.tradeSaveFailed('Unable to reach the server')
    }
  }

  // ── Filtered trades ─────────────────────────────────────────────────────────
  const filtered = trades.filter(t => {
    const matchSource = filterSource === 'all' || t.source === filterSource
    const matchSearch = !search || t.symbol.toLowerCase().includes(search.toLowerCase())
    return matchSource && matchSearch
  })

  const csvTrades = trades.filter(t => t.source === 'csv')
  const recentCsvTrades = csvTrades.filter(
    t => new Date(t.created_at) > new Date(Date.now() - 10 * 60 * 1000)
  )

  const sourceCounts = {
    all: trades.length,
    csv: trades.filter(t => t.source === 'csv').length,
    manual: trades.filter(t => t.source === 'manual').length,
    mt5: trades.filter(t => t.source === 'mt5').length,
    ctrader: trades.filter(t => t.source === 'ctrader').length,
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/50 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Trade Journal</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Log trades, add notes and screenshots</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto gap-2 bg-[#0A1F44] hover:bg-[#071530] text-white"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Trade</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="font-semibold text-foreground mb-2">Log Trades</h3>
          <p className="text-sm text-muted-foreground">Use the "New Trade" button to manually log trades, or import from Settings / Broker &amp; Import.</p>
        </Card>
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="font-semibold text-foreground mb-2">Add Screenshots</h3>
          <p className="text-sm text-muted-foreground">Expand any trade below to upload screenshots of your setup and entry.</p>
        </Card>
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="font-semibold text-foreground mb-2">Write Notes</h3>
          <p className="text-sm text-muted-foreground">Add journal notes to any trade to record what went well, what to improve, and key lessons.</p>
        </Card>
      </div>

      {/* New import notification banner */}
      {showImportBanner && recentCsvTrades.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">
              {recentCsvTrades.length} new trade{recentCsvTrades.length > 1 ? 's' : ''} imported
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Journal now while the details are still fresh. Expand any trade below to add notes and screenshots.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowImportBanner(false)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by symbol..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(sourceCounts) as FilterSource[]).map(src => {
            const count = sourceCounts[src]
            if (src !== 'all' && count === 0) return null
            return (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  filterSource === src
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
                }`}
              >
                {src === 'all' ? 'All' : src.toUpperCase()} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Trade list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border border-border/50">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No trades yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {filterSource !== 'all'
              ? `No ${filterSource.toUpperCase()} trades found. Try a different filter.`
              : 'Use "New Trade" to log manually, or import from Settings / Broker & Import.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
            {filterSource !== 'all' ? ` from ${filterSource.toUpperCase()}` : ''}
            {search ? ` matching "${search}"` : ''}
          </p>
          {filtered.map(trade => (
            <TradeJournalEntryCard
              key={trade.id}
              trade={trade}
              defaultExpanded={trade.id === highlightId}
              onJournaled={() => {}}
            />
          ))}
        </div>
      )}

      {/* Trade Modal */}
      {showModal && (
        <TradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleAddTrade}
          editingTrade={null}
        />
      )}
    </div>
  )
}
