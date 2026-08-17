'use client'

import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts'
import { HoldingTimeBucket, HoldingTimeTradeData } from '@/lib/time-analysis-utils'

interface HoldingTimeVsPnLCardProps {
  buckets: HoldingTimeBucket[]
  tradeData: HoldingTimeTradeData[]
  totalTrades: number
}

export function HoldingTimeVsPnLCard({ buckets, tradeData, totalTrades }: HoldingTimeVsPnLCardProps) {
  // Prepare data for three line graphs based on holding time buckets
  const shortTermTrades = tradeData.filter(d => d.duration < 30)
  const mediumTermTrades = tradeData.filter(d => d.duration >= 30 && d.duration < 480)
  const longTermTrades = tradeData.filter(d => d.duration >= 480)

  const prepareChartData = (trades: HoldingTimeTradeData[]) => {
    return trades
      .sort((a, b) => a.duration - b.duration)
      .map((trade, idx) => ({
        x: trade.duration,
        y: trade.pnl,
        isWin: trade.isWin,
      }))
  }

  const shortData = prepareChartData(shortTermTrades)
  const mediumData = prepareChartData(mediumTermTrades)
  const longData = prepareChartData(longTermTrades)

  const chartConfig = {
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
    height: 250,
  }

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h2 className="text-xl font-semibold text-foreground mb-4">Holding Time vs P&L</h2>

      {/* Total Trades Display */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-sm text-muted-foreground mb-1">Total Trades Analyzed</p>
        <p className="text-3xl font-bold text-foreground">{totalTrades}</p>
      </div>

      {/* Duration Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Duration</th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Trades</th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Win Rate</th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Avg P&L</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket, idx) => (
              <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-3 px-3 text-foreground">{bucket.bucket}</td>
                <td className="text-right py-3 px-3 text-foreground font-medium">{bucket.trades}</td>
                <td className="text-right py-3 px-3">
                  <span
                    className={
                      bucket.winRate > 55
                        ? 'text-emerald-600 font-semibold'
                        : bucket.winRate > 45
                        ? 'text-amber-600 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {bucket.winRate.toFixed(1)}%
                  </span>
                </td>
                <td
                  className={`text-right py-3 px-3 font-semibold ${
                    bucket.avgPnL >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {bucket.avgPnL >= 0 ? '+' : ''}{bucket.avgPnL.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Three Charts */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {/* Short Duration Chart */}
        {shortData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Short Holding Time (&lt; 30 min)</h3>
            <ResponsiveContainer width="100%" height={chartConfig.height}>
              <ScatterChart margin={chartConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" label={{ value: 'Duration (min)', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'P&L', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Scatter
                  data={shortData}
                  fill="#10b981"
                  shape="circle"
                  dataKey="y"
                  name="P&L"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Medium Duration Chart */}
        {mediumData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Medium Holding Time (30 min - 8 hrs)</h3>
            <ResponsiveContainer width="100%" height={chartConfig.height}>
              <ScatterChart margin={chartConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" label={{ value: 'Duration (min)', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'P&L', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Scatter
                  data={mediumData}
                  fill="#3b82f6"
                  shape="circle"
                  dataKey="y"
                  name="P&L"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Long Duration Chart */}
        {longData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Long Holding Time (&gt; 8 hrs)</h3>
            <ResponsiveContainer width="100%" height={chartConfig.height}>
              <ScatterChart margin={chartConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" label={{ value: 'Duration (min)', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'P&L', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Scatter
                  data={longData}
                  fill="#a855f7"
                  shape="circle"
                  dataKey="y"
                  name="P&L"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {tradeData.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No trades data available</p>
      )}
    </Card>
  )
}
