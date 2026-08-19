"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Trade {
  id: string
  symbol: string
  type: "long" | "short"
  riskReward: number
  pnl: number
  status: string
  session: string
}

interface TradesTableProps {
  title: string
  trades?: Trade[]
}

export function TradesTable({ title, trades }: TradesTableProps) {
  if (!trades || trades.length === 0) {
    return (
      <Card className="p-5 bg-card border border-[#E2E8F0] shadow-sm">
        <h3 className="text-lg font-semibold text-[#1E293B] dark:text-foreground mb-4">
          {title}
        </h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No trades yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 bg-card border border-[#E2E8F0] shadow-sm">
      <h3 className="text-lg font-semibold text-[#1E293B] dark:text-foreground mb-4">
        {title}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left py-3 px-2 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Symbol
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                RR
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                PnL
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Session
              </th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isProfit = trade.pnl >= 0
              return (
                <tr 
                  key={trade.id} 
                  className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-accent-blue-subtle transition-colors cursor-pointer"
                >
                  <td className="py-3 px-2">
                    <span className="font-medium text-[#1E293B] dark:text-foreground">
                      {trade.symbol}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <Badge 
                      variant="secondary"
                      className={`text-xs font-medium ${
                        trade.type === 'long' 
                          ? 'bg-[#ECFDF5] text-[#059669]' 
                          : 'bg-[#FEF2F2] text-[#DC2626]'
                      }`}
                    >
                      {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-[#1E293B] dark:text-foreground">
                      {trade.riskReward.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`font-medium ${
                      trade.pnl === 0 
                        ? 'text-[#64748B]' 
                        : isProfit 
                          ? 'text-[#059669]' 
                          : 'text-[#DC2626]'
                    }`}>
                      {trade.pnl === 0 ? '-' : `${isProfit ? '+' : ''}${Math.abs(trade.pnl).toFixed(2)}`}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-[#1E293B] dark:text-foreground text-sm">
                      {trade.session}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
