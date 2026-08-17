'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Plus, Target } from 'lucide-react'

const GOALS = [
  { title: 'March Profit Target', type: 'Profit target', current: 1250, target: 2000, progress: 62 },
  { title: 'Stay consistent with journalling', type: 'Journalling', current: 8, target: 12, progress: 67 },
]

export function GoalsPreview() {
  const [showNewGoal, setShowNewGoal] = useState(false)

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border/50 bg-background shadow-2xl">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-card border-b border-border/40">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 mx-4 h-5 rounded bg-muted/40 text-[9px] text-muted-foreground flex items-center justify-center font-mono">
          app.jnvpro.com/dashboard/personal-area/goals
        </div>
      </div>

      <div className="p-5 bg-background">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-primary font-semibold">Personal Area / Goals</p>
            <h3 className="text-base font-semibold text-foreground mt-1">Set and track your trading objectives</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNewGoal((value) => !value)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground"
          >
            <Plus className="h-3 w-3" /> Add Goal
          </button>
        </div>

        {showNewGoal && (
          <div className="mb-3 rounded-lg border border-border bg-card p-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-medium"><Target className="h-3.5 w-3.5 text-primary" /> New Goal</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded border border-border bg-background px-2 py-1.5">Goal Name</div>
              <div className="rounded border border-border bg-background px-2 py-1.5">Type of Goal</div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {GOALS.map((goal) => (
            <div key={goal.title} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start gap-2">
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{goal.title}</p>
                  <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">{goal.type}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{goal.current} / {goal.target}</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Create a goal and track progress session by session.
        </div>
      </div>
    </div>
  )
}
