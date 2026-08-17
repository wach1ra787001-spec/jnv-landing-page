"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Trade {
  id: string
  symbol: string
  trade_type: "buy" | "sell"
  entry_price: number
  lot_size: number
  entry_time: string
}

interface ActiveTradesCardProps {
  trades: Trade[]
}

// Simulated current prices - in production this would come from a real-time feed
function getCurrentPrice(symbol: string, entryPrice: number): number {
  const variation = (Math.random() - 0.5) * 0.02 // +/- 1% variation
  return entryPrice * (1 + variation)
}

export function ActiveTradesCard({ trades }: ActiveTradesCardProps) {
  return (
    <Card className="border border-border bg-card h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium text-foreground">Active Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length > 0 ? (
          <div className="space-y-3">
            {trades.map((trade) => {
              const currentPrice = getCurrentPrice(trade.symbol, trade.entry_price)
              const floatingPnl = trade.trade_type === "buy" 
                ? (currentPrice - trade.entry_price) * trade.lot_size * 100000
                : (trade.entry_price - currentPrice) * trade.lot_size * 100000
              const isPositive = floatingPnl >= 0

              return (
                <div 
                  key={trade.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{trade.symbol}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        trade.trade_type === "buy" 
                          ? "bg-chart-1/10 text-chart-1" 
                          : "bg-chart-2/10 text-chart-2"
                      }`}>
                        {trade.trade_type === "buy" ? "Long" : "Short"}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Entry: <span className="font-mono">${trade.entry_price.toFixed(5)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current: <span className="font-mono">${currentPrice.toFixed(5)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold font-mono ${
                      isPositive ? "text-chart-1" : "text-chart-2"
                    }`}>
                      {isPositive ? "+" : ""}${floatingPnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">No active trades</p>
            <Button size="sm" asChild>
              <Link href="/dashboard/journal/new">Open Trade</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
