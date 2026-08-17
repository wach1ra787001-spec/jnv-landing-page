"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
import { EquityCurveDataPoint } from "@/lib/generate-chart-data"

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { label: string } }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E293B] text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-medium">{payload[0].payload.label}</p>
        <p className="text-[#0EA5E9]">${payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

interface EquityCurveProps {
  data?: EquityCurveDataPoint[]
  period?: string
  onPeriodChange?: (period: string) => void
}

export function EquityCurve({ data = [], period = "monthly", onPeriodChange }: EquityCurveProps) {
  const [localPeriod, setLocalPeriod] = useState(period)

  const handlePeriodChange = (newPeriod: string) => {
    setLocalPeriod(newPeriod)
    onPeriodChange?.(newPeriod)
  }

  const periods = [
    { key: "today", label: "Today" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
  ]

  if (!data || data.length === 0) {
    return (
      <Card className="p-5 bg-card border border-[#E2E8F0] shadow-sm h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No trading data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start trading to see your equity curve</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 bg-card border border-[#E2E8F0] shadow-sm h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-[#1E293B] dark:text-foreground">
          Equity Curve
        </h3>
        <div className="flex gap-1 bg-[#F1F5F9] dark:bg-secondary p-1 rounded-lg">
          {periods.map((p) => (
            <Button
              key={p.key}
              variant="ghost"
              size="sm"
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                localPeriod === p.key 
                  ? 'bg-white dark:bg-card text-[#1E293B] dark:text-foreground shadow-sm' 
                  : 'text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-muted'
              }`}
              onClick={() => handlePeriodChange(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0EA5E9"
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
