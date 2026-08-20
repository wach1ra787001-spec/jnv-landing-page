'use client'

import { Card } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export function PreMarketPlanningCard() {
  return (
    <Card className="p-6 bg-card border border-border/50 relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-lg font-semibold text-foreground">Pre-Market Planning</h3>
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Track whether pre-market prep sessions improve same-day performance.
      </p>

      {/* Faded mockup of the eventual dot/strip plot, matching the Win/Loss Journal Effect pattern */}
      <div aria-hidden className="relative h-[220px] rounded-md border border-dashed border-border/60 bg-muted/10 overflow-hidden opacity-40 grayscale">
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <line x1="20" y1="100" x2="280" y2="100" stroke="var(--muted-foreground)" strokeDasharray="3 3" />
          <line x1="90" y1="10" x2="90" y2="190" stroke="var(--muted-foreground)" strokeOpacity="0.3" />
          <line x1="210" y1="10" x2="210" y2="190" stroke="var(--muted-foreground)" strokeOpacity="0.3" />
          {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((y, i) => (
            <circle key={`l-${i}`} cx={80 + ((i * 7) % 25)} cy={y} r={4} fill="var(--muted-foreground)" />
          ))}
          {[30, 55, 70, 95, 115, 130, 150, 170].map((y, i) => (
            <circle key={`r-${i}`} cx={200 + ((i * 9) % 25)} cy={y} r={4} fill="var(--muted-foreground)" />
          ))}
          <line x1="90" y1="90" x2="210" y2="60" stroke="var(--foreground)" strokeWidth="2" />
          <path d="M 90 84 L 96 90 L 90 96 L 84 90 Z" fill="var(--foreground)" />
          <path d="M 210 54 L 216 60 L 210 66 L 204 60 Z" fill="var(--foreground)" />
        </svg>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
        <div className="text-center px-6">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Coming soon</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
            Log pre-market plans to unlock this comparison.
          </p>
        </div>
      </div>
    </Card>
  )
}
