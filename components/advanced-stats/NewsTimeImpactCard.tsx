'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface NewsTimeStats {
  trades: number
  wins: number
  losses: number
  winRate: number
  pnl: number
}

interface NewsTimeImpactCardProps {
  nearNews: NewsTimeStats
  normalTime: NewsTimeStats
}

export function NewsTimeImpactCard({ nearNews, normalTime }: NewsTimeImpactCardProps) {
  const getWinRateColor = (winRate: number) => {
    if (winRate > 55) return 'text-emerald-600'
    if (winRate > 45) return 'text-amber-600'
    return 'text-red-600'
  }

  const winRateDifference = nearNews.winRate - normalTime.winRate

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h2 className="text-xl font-semibold text-foreground mb-6">News Time Impact</h2>

      {/* Main Comparison Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Near News Column */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Trading Near News</h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-foreground">{nearNews.trades}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
              <p className={`text-2xl font-bold ${getWinRateColor(nearNews.winRate)}`}>
                {nearNews.winRate.toFixed(1)}%
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Wins</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <p className="font-bold text-emerald-600">{nearNews.wins}</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Losses</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="font-bold text-red-600">{nearNews.losses}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200">
              <p className="text-xs text-muted-foreground mb-1">Net P&L</p>
              <p
                className={`text-lg font-bold ${
                  nearNews.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {nearNews.pnl >= 0 ? '+' : ''}{nearNews.pnl.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Normal Time Column */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Normal Trading Times</h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-foreground">{normalTime.trades}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
              <p className={`text-2xl font-bold ${getWinRateColor(normalTime.winRate)}`}>
                {normalTime.winRate.toFixed(1)}%
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Wins</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <p className="font-bold text-emerald-600">{normalTime.wins}</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Losses</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="font-bold text-red-600">{normalTime.losses}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200">
              <p className="text-xs text-muted-foreground mb-1">Net P&L</p>
              <p
                className={`text-lg font-bold ${
                  normalTime.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {normalTime.pnl >= 0 ? '+' : ''}{normalTime.pnl.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insight */}
      {normalTime.trades > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-sm text-muted-foreground mb-2">Key Insight</p>
          <p className="text-foreground">
            Your win rate during news times is{' '}
            <span
              className={`font-bold ${
                winRateDifference >= 0
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {Math.abs(winRateDifference).toFixed(1)}% {winRateDifference >= 0 ? 'higher' : 'lower'}
            </span>
            {' '}compared to normal trading times. {winRateDifference < -10 ? 'Consider avoiding trades near major news events.' : ''}
          </p>
        </div>
      )}

      {nearNews.trades === 0 && normalTime.trades === 0 && (
        <p className="text-center text-muted-foreground py-8">No trades data available</p>
      )}
    </Card>
  )
}
