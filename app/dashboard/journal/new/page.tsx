'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPendingImportedTradeAt, removePendingImportedTradeAt, getPendingImportedTradesCount } from '@/lib/pending-imports'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { appToast } from '@/lib/toast-utils'
import Link from 'next/link'
import { TradeForm, DEFAULT_TRADE_FORM_VALUES, type TradeFormValues } from '@/components/journal/trade-form'
import { TradeSaveSuccess } from '@/components/journal/trade-save-success'

export default function AddNewTradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialValues, setInitialValues] = useState<Partial<TradeFormValues>>({})
  const [showTradeSaveSuccess, setShowTradeSaveSuccess] = useState(false)
  const [pendingImportIndex, setPendingImportIndex] = useState<number | null>(null)
  const [pendingImportId, setPendingImportId] = useState<string | null>(null)
  const [pendingImportCount, setPendingImportCount] = useState(0)
  const [hasPendingImport, setHasPendingImport] = useState(false)

  useEffect(() => {
    const loadPendingTrade = async () => {
      try {
      const rawIndex = searchParams.get('importIndex')
      const index = rawIndex !== null ? Number.parseInt(rawIndex, 10) : null
      if (index === null || Number.isNaN(index)) return

      const response = await fetch('/api/trades/pending-imports')
      const payload = response.ok ? await response.json() : null
      const persistentTrade = payload?.trades?.[index]
      const trade = persistentTrade ?? getPendingImportedTradeAt(index)
      if (!trade) return

      setHasPendingImport(true)
      setPendingImportIndex(index)
      setPendingImportId(typeof persistentTrade?.id === 'string' ? persistentTrade.id : null)
      setPendingImportCount(Array.isArray(payload?.trades) ? payload.trades.length : getPendingImportedTradesCount())
      setInitialValues({
        ...DEFAULT_TRADE_FORM_VALUES,
        symbol: trade.symbol || '',
        direction: trade.direction === 'short' ? 'sell' : 'buy',
        entry_price: trade.entry_price?.toString() || '',
        exit_price: trade.exit_price?.toString() || '',
        lot_size: trade.lot_size?.toString() || '',
        open_time: trade.entry_time ? new Date(trade.entry_time).toISOString().slice(0, 16) : '',
        close_time: trade.exit_time ? new Date(trade.exit_time).toISOString().slice(0, 16) : '',
        pnl: trade.pnl?.toString() || '',
        // Carry the imported net P&L/commission/swap/reference through so the
        // saved trade's analytics match the source broker/CSV data exactly,
        // instead of being recalculated (or left blank) once journaled.
        net_pnl: typeof trade.net_pnl === 'number' ? trade.net_pnl.toString() : '',
        commission: typeof trade.commission === 'number' ? trade.commission.toString() : '',
        swap: typeof trade.swap === 'number' ? trade.swap.toString() : '',
        stop_loss: typeof trade.stop_loss === 'number' ? trade.stop_loss.toString() : '',
        take_profit: typeof trade.take_profit === 'number' ? trade.take_profit.toString() : '',
        external_ref: typeof trade.external_ref === 'string' ? trade.external_ref : '',
        import_source: typeof trade.source === 'string' ? trade.source : 'csv',
        status: 'closed',
      })
    } catch (error) {
      console.error('[v0] Could not load pending imported trade:', error)
      }
    }
    void loadPendingTrade()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaved = (result: any) => {
    if (hasPendingImport && pendingImportId) {
      void fetch('/api/trades/pending-imports', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: pendingImportId }) })
    } else if (hasPendingImport && pendingImportIndex !== null) {
      removePendingImportedTradeAt(pendingImportIndex)
    }
    appToast.tradeSaved(result.symbol, result.pnl?.toFixed(2), '', result.pnl >= 0)
    setShowTradeSaveSuccess(true)
  }

  return (
    <>
      <TradeSaveSuccess open={showTradeSaveSuccess} onComplete={() => router.push('/dashboard/trade-history')} />
      <div className="flex flex-col gap-8 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/journal">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Log a Trade</h1>
            <p className="text-sm text-muted-foreground">
              {hasPendingImport
                ? `Review this imported trade and complete its strategy details${pendingImportCount > 1 ? ` (${pendingImportCount} remaining)` : ''}.`
                : 'Enter your trade details below'}
            </p>
          </div>
        </div>

        <TradeForm
          mode="create"
          initialValues={initialValues}
          requireStrategy={hasPendingImport}
          onCancel={() => router.push('/dashboard/journal')}
          onSaved={handleSaved}
        />
      </div>
    </>
  )
}
