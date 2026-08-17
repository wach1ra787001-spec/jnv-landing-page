'use client'

import { Upload, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { heroPreviewData } from '@/lib/mock/hero-preview'

export function HeroImportCard() {
  const { importStrategies } = heroPreviewData

  return (
    <div className="w-full h-full p-5 bg-gradient-to-br from-background to-background/95 flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Upload className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Import Strategies</h3>
        </div>
        <p className="text-xs text-foreground/60">Import from other platforms</p>
      </div>

      {/* Import Options */}
      <div className="space-y-2 flex-1">
        {importStrategies.map((strategy) => (
          <div
            key={strategy.platform}
            className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-border/50 hover:bg-white/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-xs font-bold text-white">
                  {strategy.platform[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{strategy.platform}</p>
                  <p className="text-xs text-foreground/60">{strategy.strategyCount} strategies</p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-auto pt-3">
        <button className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          Import Now
        </button>
      </div>
    </div>
  )
}
