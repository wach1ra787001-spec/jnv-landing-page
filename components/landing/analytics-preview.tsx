'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'

const mockStats = [
  { label: 'Win Rate', value: '67.3%', change: '+2.1%', trend: 'up' },
  { label: 'Profit Factor', value: '2.14', change: '+0.3', trend: 'up' },
  { label: 'Avg R:R', value: '1:2.8', change: '+0.2', trend: 'up' },
  { label: 'Max Drawdown', value: '-4.2%', change: '-1.1%', trend: 'down' },
]

const recentTrades = [
  { pair: 'EUR/USD', type: 'Long', result: '+$847', rr: '2.1R', status: 'win' },
  { pair: 'GBP/JPY', type: 'Short', result: '+$1,234', rr: '3.2R', status: 'win' },
  { pair: 'USD/CAD', type: 'Long', result: '-$312', rr: '-1.0R', status: 'loss' },
  { pair: 'AUD/USD', type: 'Short', result: '+$567', rr: '1.8R', status: 'win' },
]

export function AnalyticsPreview() {
  return (
    <section id="analytics" className="scroll-mt-20 px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See Your Edge in Real-Time
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Comprehensive dashboards that reveal the metrics that matter most to your trading success.
          </p>
        </div>

        <div className="mt-16">
          {/* Dashboard Preview */}
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-1">
            <div className="rounded-xl bg-background p-6">
              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {mockStats.map((stat) => (
                  <Card key={stat.label} className="border-border/50 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                        {stat.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                        <span className={`text-sm ${stat.trend === 'up' ? 'text-primary' : 'text-destructive'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Chart Placeholder + Recent Trades */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Equity Curve Placeholder */}
                <Card className="border-border/50 bg-card/50 lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Activity className="h-4 w-4 text-primary" />
                      Equity Curve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-48">
                      {/* Simplified chart representation */}
                      <svg className="h-full w-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="oklch(0.65 0.2 145)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="oklch(0.65 0.2 145)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,120 Q50,100 100,90 T200,70 T300,40 T400,20"
                          fill="none"
                          stroke="oklch(0.65 0.2 145)"
                          strokeWidth="2"
                        />
                        <path
                          d="M0,120 Q50,100 100,90 T200,70 T300,40 T400,20 L400,150 L0,150 Z"
                          fill="url(#gradient)"
                        />
                      </svg>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Trades */}
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Recent Trades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentTrades.map((trade, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                        <div>
                          <span className="font-medium text-foreground">{trade.pair}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{trade.type}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono text-sm ${trade.status === 'win' ? 'text-primary' : 'text-destructive'}`}>
                            {trade.result}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">{trade.rr}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
