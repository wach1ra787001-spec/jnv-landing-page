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
  const [pendingImportCount, setPendingImportCount] = useState(0)
  const [hasPendingImport, setHasPendingImport] = useState(false)

  useEffect(() => {
    try {
      const rawIndex = searchParams.get('importIndex')
      const index = rawIndex !== null ? Number.parseInt(rawIndex, 10) : null
      if (index === null || Number.isNaN(index)) return

      const trade = getPendingImportedTradeAt(index)
      if (!trade) return

      setHasPendingImport(true)
      setPendingImportIndex(index)
      setPendingImportCount(getPendingImportedTradesCount())
      setInitialValues({
        ...DEFAULT_TRADE_FORM_VALUES,
        symbol: trade.symbol || '',
        direction: trade.direction === 'short' ? 'sell' : 'buy',
        entry_price: trade.entry_price?.toString() || '',
        exit_price: trade.exit_price?.toString() || '',
        lot_size: trade.lot_size?.toString() || '',
        open_time: trade.open_time ? new Date(trade.open_time).toISOString().slice(0, 16) : '',
        close_time: trade.close_time ? new Date(trade.close_time).toISOString().slice(0, 16) : '',
        pnl: trade.pnl?.toString() || '',
        status: 'closed',
      })
    } catch (error) {
      console.error('[v0] Could not load pending imported trade:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaved = (result: any) => {
    if (hasPendingImport && pendingImportIndex !== null) {
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
