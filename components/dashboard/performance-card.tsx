"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface TradeMetrics {
  id: string
  user_id: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  total_pnl: number
  win_rate: number
  profit_factor: number
  average_win: number
  average_loss: number
  largest_win: number
  largest_loss: number
}

interface PerformanceCardProps {
  metrics: TradeMetrics | null
}

const timeFrames = ["Daily", "Weekly", "Monthly", "Yearly"] as const
type TimeFrame = typeof timeFrames[number]

// Sample data - in production this would come from actual trade data
const generateSampleData = (timeFrame: TimeFrame) => {
  const dataPoints = timeFrame === "Daily" ? 7 : timeFrame === "Weekly" ? 4 : timeFrame === "Monthly" ? 12 : 5
  const labels = timeFrame === "Daily" 
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : timeFrame === "Weekly"
    ? ["Week 1", "Week 2", "Week 3", "Week 4"]
    : timeFrame === "Monthly"
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["2020", "2021", "2022", "2023", "2024"]
  
  let cumulative = 0
  return labels.slice(0, dataPoints).map((label) => {
    cumulative += (Math.random() - 0.4) * 500
    return { name: label, pnl: Math.round(cumulative) }
  })
}

export function PerformanceCard({ metrics }: PerformanceCardProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("Weekly")
  const data = generateSampleData(timeFrame)
  const lastValue = data[data.length - 1]?.pnl || 0
  const isPositive = lastValue >= 0

  return (
    <Card className="border border-border bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium text-foreground">Performance</CardTitle>
        <div className="flex rounded-lg bg-muted p-1">
          {timeFrames.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timeFrame === tf
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className={`text-2xl font-bold ${isPositive ? "text-chart-1" : "text-chart-2"}`}>
            {isPositive ? "+" : ""}${lastValue.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground ml-2">cumulative P&L</span>
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
              />
              <Line 
                type="monotone" 
                dataKey="pnl" 
                stroke={isPositive ? "var(--chart-1)" : "var(--chart-2)"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
