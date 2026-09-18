'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { appToast } from '@/lib/toast-utils'
import Link from 'next/link'
import { TradeForm, DEFAULT_TRADE_FORM_VALUES, type TradeFormValues } from '@/components/journal/trade-form'
import { TradeSaveSuccess } from '@/components/journal/trade-save-success'

export default function EditTradePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const tradeId = params.id
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<TradeFormValues> | null>(null)
  const [initialScreenshotUrls, setInitialScreenshotUrls] = useState<string[]>([])
  const [showTradeSaveSuccess, setShowTradeSaveSuccess] = useState(false)

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/trades/${tradeId}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const trade = await res.json()
        setInitialValues({
          ...DEFAULT_TRADE_FORM_VALUES,
          symbol: trade.symbol || '',
          direction: trade.direction === 'short' ? 'sell' : 'buy',
          entry_price: trade.entry_price?.toString() || '',
          exit_price: trade.exit_price?.toString() || '',
          stop_loss: trade.stop_loss?.toString() || '',
          take_profit: trade.take_profit?.toString() || '',
          lot_size: trade.quantity?.toString() || '',
          open_time: trade.entry_time ? new Date(trade.entry_time).toISOString().slice(0, 16) : '',
          close_time: trade.exit_time ? new Date(trade.exit_time).toISOString().slice(0, 16) : '',
          pnl: trade.pnl?.toString() || '',
          pnl_percent: trade.pnl_percent?.toString() || '',
          r_multiple: trade.r_multiple?.toString() || '',
          risk_amount: trade.risk_amount?.toString() || '',
          strategy: trade.strategy || '',
          emotion_before: trade.emotion_before || '',
          notes: trade.notes || '',
          account_id: trade.account_id || '',
          followed_rule_ids: trade.followed_rule_ids || [],
          followed_rules: trade.followed_rules || [],
        })
        setInitialScreenshotUrls(trade.screenshot_urls || [])
      } catch (error) {
        console.error('[v0] Error fetching trade to edit:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (tradeId) fetchTrade()
  }, [tradeId])

  const handleSaved = (result: any) => {
    appToast.tradeSaved(result.symbol, result.pnl?.toFixed(2), result.pnl_percent?.toFixed?.(2) ?? '', result.pnl >= 0)
    setShowTradeSaveSuccess(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading trade...</p>
        </div>
      </div>
    )
  }

  if (notFound || !initialValues) {
    return (
      <Card className="p-12 bg-card border-border text-center">
        <p className="text-muted-foreground mb-4">Trade not found</p>
        <Link href="/dashboard/trade-history">
          <Button>Back to Trade History</Button>
        </Link>
      </Card>
    )
  }

  return (
    <>
      <TradeSaveSuccess open={showTradeSaveSuccess} onComplete={() => router.push('/dashboard/trade-history')} />
      <div className="flex flex-col gap-8 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/trade-history">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Trade</h1>
            <p className="text-sm text-muted-foreground">Update your trade details below</p>
          </div>
        </div>

        <TradeForm
          mode="edit"
          tradeId={tradeId}
          initialValues={initialValues}
          initialScreenshotUrls={initialScreenshotUrls}
          onCancel={() => router.push('/dashboard/trade-history')}
          onSaved={handleSaved}
        />
      </div>
    </>
  )
}
