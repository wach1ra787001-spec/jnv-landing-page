'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ModelsAnalysisClientProps {
  trades: any[]
}

export function ModelsAnalysisClient({ trades }: ModelsAnalysisClientProps) {
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
          <h1 className="text-3xl font-semibold text-foreground">Models & Setup</h1>
          <p className="text-muted-foreground mt-1">
            Performance breakdown by strategy, setup, and market conditions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Setup Performance</h3>
          <p className="text-muted-foreground">Radar chart showing performance by setup type</p>
          <p className="text-xs text-muted-foreground mt-2">Total trades: {trades.length}</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Win-Loss Distribution</h3>
          <p className="text-muted-foreground">Histogram of profit and loss distributions</p>
          <p className="text-xs text-muted-foreground mt-2">Analyzing {trades.length} trades</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Bias Effects</h3>
          <p className="text-muted-foreground">How bias patterns affect setup profitability</p>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Profit Factor Analysis</h3>
          <p className="text-muted-foreground">Profitability metrics by strategy</p>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </Card>
      </div>
    </div>
  )
}
