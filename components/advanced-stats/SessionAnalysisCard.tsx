'use client'

import { Card } from '@/components/ui/card'
import { SessionStats } from '@/lib/time-analysis-utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SessionAnalysisCardProps {
  sessions: SessionStats[]
}

export function SessionAnalysisCard({ sessions }: SessionAnalysisCardProps) {
  const getWinRateColor = (winRate: number) => {
    if (winRate > 55) return 'text-emerald-600'
    if (winRate > 45) return 'text-amber-600'
    return 'text-red-600'
  }

  const getWinRateBg = (winRate: number) => {
    if (winRate > 55) return 'bg-emerald-50'
    if (winRate > 45) return 'bg-amber-50'
    return 'bg-red-50'
  }

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h2 className="text-xl font-semibold text-foreground mb-6">Session Analysis</h2>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.name}
            className={`p-4 rounded-lg border ${getWinRateBg(session.winRate)} border-transparent`}
          >
            {/* Header with Session Name */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{session.name}</h3>
              <span className="text-sm font-medium text-muted-foreground">
                {session.trades} trades
              </span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Win Rate */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className={`text-lg font-bold ${getWinRateColor(session.winRate)}`}>
                  {session.winRate.toFixed(1)}%
                </p>
              </div>

              {/* Wins */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Wins</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <p className="text-lg font-bold text-emerald-600">{session.wins}</p>
                </div>
              </div>

              {/* Losses */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Losses</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-lg font-bold text-red-600">{session.losses}</p>
                </div>
              </div>
            </div>

            {/* PnL Footer */}
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <p className="text-xs text-muted-foreground mb-1">Net P&L</p>
              <p
                className={`text-lg font-bold ${
                  session.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {session.pnl >= 0 ? '+' : ''}{session.pnl.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No trades data available</p>
      )}
    </Card>
  )
}
