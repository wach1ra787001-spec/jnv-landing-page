"use client"

import { useState } from "react"
import { DailyAnalysis } from "./daily-analysis"
import { generateDailyPnLByPeriod } from "@/lib/generate-chart-data"
import { Database } from "@/types/supabase"

type Trade = Database['public']['Tables']['trades']['Row']

interface AnalysisGridProps {
  userId: string
  currency: string
  trades: Trade[]
}

export function AnalysisGrid({ userId, currency, trades }: AnalysisGridProps) {
  const [period, setPeriod] = useState("1M")
  
  // Generate daily PnL data based on selected period
  const dailyPnLData = generateDailyPnLByPeriod(trades, period)

  return (
    <div className="grid grid-cols-1 gap-8">
      <DailyAnalysis data={dailyPnLData} />
    </div>
  )
}
