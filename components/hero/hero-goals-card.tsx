'use client'

import { heroPreviewData } from '@/lib/mock/hero-preview'
import { CheckCircle2, Circle } from 'lucide-react'

export function HeroGoalsCard() {
  const { goals } = heroPreviewData

  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-background to-background/95 flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">{goals.title}</h3>
        <p className="text-xs text-muted-foreground">{goals.description}</p>
      </div>

      {/* Goals List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {goals.goals.map((goal) => (
          <div key={goal.id} className="space-y-1">
            {/* Goal Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{goal.name}</p>
              {goal.status === 'on-track' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Circle className="w-4 h-4 text-amber-600" />
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{goal.current}</span>
              <span>{goal.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
