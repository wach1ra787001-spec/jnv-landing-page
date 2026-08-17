'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, ArrowLeft } from "lucide-react"
import { TradeNotes } from "@/components/trades/trade-notes"
import { ScreenshotCard } from "./screenshot-card"
import { cn } from "@/lib/utils"

interface Trade {
  id: string
  symbol: string
  direction: string
  entry_price: number
  exit_price: number
  quantity: number
  entry_time: string
  exit_time: string
  pnl: number
  pnl_percent: number
  status: string
  strategy: string
  setup_type: string
  user_id: string
  [key: string]: any
}

interface TradeDetailClientProps {
  trade: Trade
  userId: string
}

export default function TradeDetailClient({ trade, userId }: TradeDetailClientProps) {
  const router = useRouter()

  const isProfit = trade.pnl >= 0
  const entryDate = new Date(trade.entry_time)
  const exitDate = new Date(trade.exit_time)
  const duration = Math.round((exitDate.getTime() - entryDate.getTime()) / (1000 * 60))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{trade.symbol}</h1>
            <p className="text-muted-foreground">{trade.strategy || 'No strategy recorded'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-3xl font-bold",
            isProfit ? "text-chart-1" : "text-chart-2"
          )}>
            {isProfit ? '+' : ''}{trade.pnl.toFixed(2)}
          </p>
          <p className={cn(
            "text-sm font-medium",
            isProfit ? "text-chart-1" : "text-chart-2"
          )}>
            {isProfit ? '+' : ''}{trade.pnl_percent?.toFixed(2) || '0'}%
          </p>
        </div>
      </div>

      {/* Trade Details */}
      <Card className="p-6 bg-card border border-border/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Direction</p>
            <div className="flex items-center gap-2 mt-2">
              {trade.direction === 'BUY' ? (
                <ArrowUpRight className="w-4 h-4 text-chart-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-chart-2" />
              )}
              <p className="font-medium text-foreground">{trade.direction}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entry Price</p>
            <p className="font-medium text-foreground mt-2">{trade.entry_price.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exit Price</p>
            <p className="font-medium text-foreground mt-2">{trade.exit_price.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantity</p>
            <p className="font-medium text-foreground mt-2">{trade.quantity}</p>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6 bg-card border border-border/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entry Time</p>
            <p className="font-medium text-foreground mt-2">{entryDate.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exit Time</p>
            <p className="font-medium text-foreground mt-2">{exitDate.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</p>
            <p className="font-medium text-foreground mt-2">{duration} minutes</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
            <p className="font-medium text-foreground mt-2">{trade.status}</p>
          </div>
        </div>
      </Card>

      {/* Screenshot Card */}
      <ScreenshotCard tradeId={trade.id} />

      {/* Trade Notes */}
      <Card className="p-6 bg-card border border-border/50">
        <TradeNotes tradeId={trade.id} />
      </Card>
    </div>
  )
}
