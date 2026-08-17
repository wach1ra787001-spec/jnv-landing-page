'use client'

import { useTimeService } from '@/lib/context/timezone-context'
import { Card } from '@/components/ui/card'

interface Trade {
  id: string
  entryTime: string // ISO string in UTC
  exitTime: string // ISO string in UTC
  pnl: number
  symbol: string
}

/**
 * Example Component: Demonstrating TimeService Usage in Analytics
 * 
 * This component shows how to:
 * 1. Use TimeService for all timestamp conversions
 * 2. Detect trading sessions from UTC trades
 * 3. Format times for display in user's timezone
 * 4. Prepare data for news impact analysis
 */
export function TimeAnalyticsExample({ trades }: { trades: Trade[] }) {
  const timeService = useTimeService()

  // Group trades by session
  const tradesBySession = trades.reduce(
    (acc, trade) => {
      const session = timeService.getSessionFromUTC(trade.entryTime)
      if (!acc[session]) acc[session] = []
      acc[session].push(trade)
      return acc
    },
    {} as Record<string, Trade[]>,
  )

  // Calculate session statistics
  const sessionStats = Object.entries(tradesBySession).map(([session, sessionTrades]) => {
    const sessionInfo = timeService.getSessionInfo(session as any)
    const winningTrades = sessionTrades.filter((t) => t.pnl > 0).length
    const totalPnL = sessionTrades.reduce((sum, t) => sum + t.pnl, 0)

    return {
      session: sessionInfo?.name || session,
      count: sessionTrades.length,
      wins: winningTrades,
      winRate: ((winningTrades / sessionTrades.length) * 100).toFixed(1),
      totalPnL: totalPnL.toFixed(2),
    }
  })

  // Analyze holding time impact
  const holdingTimeAnalysis = trades
    .map((trade) => ({
      ...trade,
      holdingMinutes: timeService.getHoldingTimeMinutes(trade.entryTime, trade.exitTime),
    }))
    .sort((a, b) => a.holdingMinutes - b.holdingMinutes)

  // Identify trades near news times
  const newsImpactTrades = trades.map((trade) => ({
    ...trade,
    nearNews: timeService.isNearNewsTime(trade.entryTime, 30),
    session: timeService.getSessionFromUTC(trade.entryTime),
    entryTimeDisplay: timeService.format(trade.entryTime, 'MMM dd, HH:mm'),
    holdingMinutes: timeService.getHoldingTimeMinutes(trade.entryTime, trade.exitTime),
    holdingBucket: timeService.getHoldingTimeBucket(
      timeService.getHoldingTimeMinutes(trade.entryTime, trade.exitTime),
    ),
  }))

  return (
    <div className="space-y-6">
      {/* Session Analysis */}
      <Card className="p-6 border border-border/50">
        <h3 className="font-semibold text-foreground mb-4">Session Performance</h3>
        <div className="space-y-3">
          {sessionStats.map((stat) => (
            <div key={stat.session} className="flex justify-between items-center p-3 bg-secondary/50 rounded">
              <div>
                <p className="font-medium text-foreground">{stat.session}</p>
                <p className="text-sm text-muted-foreground">
                  {stat.count} trades • {stat.winRate}% win rate
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {stat.totalPnL > 0 ? '+' : ''}{stat.totalPnL}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Holding Time Analysis */}
      <Card className="p-6 border border-border/50">
        <h3 className="font-semibold text-foreground mb-4">Holding Time Impact</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {holdingTimeAnalysis.slice(0, 10).map((trade) => (
            <div key={trade.id} className="flex justify-between text-sm p-2 hover:bg-secondary/50 rounded">
              <span className="text-muted-foreground">
                {trade.symbol} • {trade.holdingMinutes}m
              </span>
              <span className={trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}>
                {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* News Impact Table */}
      <Card className="p-6 border border-border/50">
        <h3 className="font-semibold text-foreground mb-4">News Time Impact</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">Entry Time</th>
                <th className="text-left py-2 text-muted-foreground">Session</th>
                <th className="text-left py-2 text-muted-foreground">Near News</th>
                <th className="text-left py-2 text-muted-foreground">Duration</th>
                <th className="text-right py-2 text-muted-foreground">P&L</th>
              </tr>
            </thead>
            <tbody>
              {newsImpactTrades.slice(0, 10).map((trade) => (
                <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="py-3 text-foreground">{trade.entryTimeDisplay}</td>
                  <td className="py-3 text-muted-foreground capitalize">{trade.session}</td>
                  <td className="py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        trade.nearNews
                          ? 'bg-yellow-500/20 text-yellow-700'
                          : 'bg-green-500/20 text-green-700'
                      }`}
                    >
                      {trade.nearNews ? 'Near News' : 'Normal'}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{trade.holdingMinutes}m</td>
                  <td className="py-3 text-right">
                    <span className={trade.pnl > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Timezone Info */}
      <Card className="p-4 bg-secondary/50 border border-border/50">
        <p className="text-sm text-muted-foreground">
          All times displayed in your timezone: <span className="font-semibold text-foreground">{timeService.getTimezone()}</span> ({timeService.getTimezoneOffset()})
        </p>
      </Card>
    </div>
  )
}
