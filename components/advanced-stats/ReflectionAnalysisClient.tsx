'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReflectionAnalysisClientProps {
  trades: any[]
}

export function ReflectionAnalysisClient({ trades }: ReflectionAnalysisClientProps) {
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
          <h1 className="text-3xl font-semibold text-foreground">Reflection Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Understand how journalling and planning impact your trading outcomes
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Win Journal Effect</h3>
          <p className="text-muted-foreground">How journalling winning trades impacts future performance</p>
          <p className="text-xs text-muted-foreground mt-2">Total trades: {trades.length}</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Loss Journal Effect</h3>
          <p className="text-muted-foreground">Impact of post-loss journalling on recovery trades</p>
          <p className="text-xs text-muted-foreground mt-2">Analyzing {trades.length} trades</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Pre-Market Planning</h3>
          <p className="text-muted-foreground">Performance improvement from pre-market preparation</p>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Note Correlation</h3>
          <p className="text-muted-foreground">How detailed notes correlate with profitable trades</p>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </Card>
      </div>
    </div>
  )
}
