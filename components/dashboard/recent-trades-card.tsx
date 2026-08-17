import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Trade {
  id: string
  symbol: string
  trade_type: "buy" | "sell"
  entry_price: number
  exit_price: number | null
  pnl: number | null
  lot_size: number
  entry_time: string
  exit_time: string | null
}

interface RecentTradesCardProps {
  trades: Trade[]
}

export function RecentTradesCard({ trades }: RecentTradesCardProps) {
  return (
    <Card className="border border-border bg-card mx-4 sm:mx-0">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-medium text-foreground">Recent Trades</CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
          <Link href="/dashboard/journal">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {trades.length > 0 ? (
          <div className="-mx-4 sm:mx-0 overflow-x-auto px-4 sm:px-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">Symbol</th>
                  <th className="text-right py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[90px]">Entry</th>
                  <th className="text-right py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[90px]">Exit</th>
                  <th className="text-center py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[70px]">Type</th>
                  <th className="text-right py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 min-w-[80px]">
                      <span className="font-medium text-foreground text-sm">{trade.symbol}</span>
                    </td>
                    <td className="py-3 text-right text-xs sm:text-sm text-foreground font-mono min-w-[90px]">
                      ${trade.entry_price.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-xs sm:text-sm text-foreground font-mono min-w-[90px]">
                      ${trade.exit_price?.toFixed(2) || "-"}
                    </td>
                    <td className="py-3 text-center min-w-[70px]">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        trade.trade_type === "buy" 
                          ? "bg-chart-1/10 text-chart-1" 
                          : "bg-chart-2/10 text-chart-2"
                      }`}>
                        {trade.trade_type === "buy" ? "Long" : "Short"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-xs sm:text-sm min-w-[80px]">
                      <span className={`font-medium ${
                        trade.pnl && trade.pnl >= 0 ? "text-chart-1" : "text-chart-2"
                      }`}>
                        {trade.pnl ? `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}` : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No recent trades</p>
            <Button asChild>
              <Link href="/dashboard/journal/new">Log Your First Trade</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
