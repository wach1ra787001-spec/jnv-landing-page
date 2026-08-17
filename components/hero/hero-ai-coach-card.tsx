'use client'

import { Sparkles, MessageCircle, TrendingUp, Zap } from 'lucide-react'
import { heroPreviewData } from '@/lib/mock/hero-preview'

export function HeroAICoachCard() {
  const { aiCoach } = heroPreviewData

  return (
    <div className="w-full h-full p-5 bg-gradient-to-br from-background to-background/95 flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">AI Coach</h3>
        </div>
        <p className="text-xs text-foreground/60">Personalized trading insights</p>
      </div>

      {/* Main Insight */}
      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-3 mb-3 border border-purple-500/30 flex-1">
        <div className="flex items-start gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground mb-1">Today&apos;s Insight</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{aiCoach.insight}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {aiCoach.stats.map((stat) => (
          <div key={stat.label} className="bg-white/50 backdrop-blur-sm rounded p-2 border border-border/50">
            <p className="text-xs text-foreground/60 mb-1">{stat.label}</p>
            <p className="text-sm font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button className="w-full py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all flex items-center justify-center gap-2">
        <MessageCircle className="w-3 h-3" />
        Chat with Coach
      </button>
    </div>
  )
}
