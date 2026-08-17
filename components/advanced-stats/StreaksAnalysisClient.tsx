'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StreaksAnalysisClientProps {
  trades: any[]
}

export function StreaksAnalysisClient({ trades }: StreaksAnalysisClientProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with Back Button */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Streaks & Discipline</h1>
          <p className="text-muted-foreground mt-1">
            Track your winning/losing streaks, discipline milestones, and directional bias
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Direction Bias</h3>
          <p className="text-muted-foreground">Long vs Short performance and bias patterns</p>
          <p className="text-xs text-muted-foreground mt-2">Total trades: {trades.length}</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Discipline Tracker</h3>
          <p className="text-muted-foreground">Calendar heatmap of adherence to trading rules</p>
          <p className="text-xs text-muted-foreground mt-2">Analyzing {trades.length} trades</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Win-Loss Streaks</h3>
          <p className="text-muted-foreground">Consecutive win and loss patterns analysis</p>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recovery Patterns</h3>
          <p className="text-muted-foreground">How you bounce back from losing sequences</p>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </Card>
      </div>
    </div>
  )
}
