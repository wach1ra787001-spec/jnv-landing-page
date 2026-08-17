'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Calendar, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdvancedStatsClientProps {
  trades: any[]
  userTier: 'free' | 'pro' | 'elite'
}

export function AdvancedStatsClient({ trades = [], userTier = 'free' }: AdvancedStatsClientProps) {
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '6m' | '1y' | 'all'>('30d')
  const [activeTab, setActiveTab] = useState('time')

  // Filter trades based on date range
  const now = new Date()
  const filteredTrades = trades.filter(trade => {
    if (!trade.entry_time) return false
    const tradeDate = new Date(trade.entry_time)
    let cutoffDate = new Date()

    switch (dateRange) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90d':
        cutoffDate.setDate(now.getDate() - 90)
        break
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        cutoffDate = new Date('2000-01-01')
        break
    }

    return tradeDate >= cutoffDate
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Advanced Statistics</h1>
          {userTier === 'elite' && (
            <span className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
              ELITE
            </span>
          )}
        </div>
        <p className="text-muted-foreground">Deep insights into your trading performance and patterns</p>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['30d', '90d', '6m', '1y', 'all'] as const).map(range => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            {range === '30d' && 'Last 30 Days'}
            {range === '90d' && 'Last 90 Days'}
            {range === '6m' && 'Last 6 Months'}
            {range === '1y' && 'Last Year'}
            {range === 'all' && 'All Time'}
          </Button>
        ))}
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="time" className="gap-2">
            <Calendar className="w-4 h-4 hidden sm:inline" />
            <span className="hidden sm:inline">Time</span>
            <span className="sm:hidden">Time</span>
          </TabsTrigger>
          <TabsTrigger value="reflection" className="gap-2">
            <TrendingUp className="w-4 h-4 hidden sm:inline" />
            <span className="hidden sm:inline">Reflection</span>
            <span className="sm:hidden">Ref</span>
          </TabsTrigger>
          <TabsTrigger value="streaks" className="gap-2">
            <Zap className="w-4 h-4 hidden sm:inline" />
            <span className="hidden sm:inline">Streaks</span>
            <span className="sm:hidden">Str</span>
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2">
            <BarChart3 className="w-4 h-4 hidden sm:inline" />
            <span className="hidden sm:inline">Models</span>
            <span className="sm:hidden">Mod</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Time Analysis */}
        <TabsContent value="time" className="space-y-4">
          <Card className="p-6 bg-card border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Time Analysis</h3>
            <p className="text-muted-foreground">
              Analyzing your trading patterns across time: sessions, holding periods, and market timing.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Total trades analyzed: {filteredTrades.length}
            </p>
          </Card>
        </TabsContent>

        {/* Tab: Reflection Analysis */}
        <TabsContent value="reflection" className="space-y-4">
          <Card className="p-6 bg-card border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Reflection Analysis</h3>
            <p className="text-muted-foreground">
              Understanding how journalling and planning impact your trading outcomes.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Total trades analyzed: {filteredTrades.length}
            </p>
          </Card>
        </TabsContent>

        {/* Tab: Streaks Analysis */}
        <TabsContent value="streaks" className="space-y-4">
          <Card className="p-6 bg-card border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Streaks Analysis</h3>
            <p className="text-muted-foreground">
              Track your winning/losing streaks, discipline milestones, and directional bias.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Total trades analyzed: {filteredTrades.length}
            </p>
          </Card>
        </TabsContent>

        {/* Tab: Models Analysis */}
        <TabsContent value="models" className="space-y-4">
          <Card className="p-6 bg-card border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Models Analysis</h3>
            <p className="text-muted-foreground">
              Performance breakdown by strategy, setup, and market conditions.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Total trades analyzed: {filteredTrades.length}
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Elite Upgrade Banner */}
      {userTier !== 'elite' && (
        <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Upgrade to Elite</h4>
              <p className="text-sm text-muted-foreground">
                Sync your Advanced Stats to JNV AI for personalized coaching reports.
              </p>
            </div>
            <Button className="ml-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              Upgrade Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
