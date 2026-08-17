'use client'

import { heroPreviewData } from '@/lib/mock/hero-preview'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function HeroTradeJournalCard() {
  const { tradeJournal } = heroPreviewData

  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-background to-background/95 flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">{tradeJournal.title}</h3>
        <p className="text-xs text-muted-foreground">{tradeJournal.description}</p>
      </div>

      {/* Trades List */}
      <div className="space-y-3 flex-1">
        {tradeJournal.latestTrades.map((trade) => (
          <div key={trade.id} className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-border/50">
            {/* Trade Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-bold text-foreground">{trade.pair}</p>
                <p className="text-xs text-muted-foreground">{trade.type}</p>
              </div>
              <p className="text-sm font-bold text-green-600">{trade.pnl}</p>
            </div>

            {/* Trade Details */}
            <div className="text-xs text-muted-foreground space-y-1 mb-2">
              <p>Entry: {trade.entry} → Exit: {trade.exit}</p>
              <p>{trade.notes}</p>
            </div>

            {/* Tags */}
            <div className="flex gap-1 flex-wrap">
              {trade.tags.map((tag) => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
