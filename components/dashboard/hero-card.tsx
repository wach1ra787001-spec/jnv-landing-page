"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

interface HeroCardProps {
  userName: string
  streakDays?: number
  recentTrades?: Array<{ id: string; result: "win" | "loss" }>
}

export function HeroCard({ userName, streakDays = 0, recentTrades = [] }: HeroCardProps) {
  const router = useRouter()
  const [greeting, setGreeting] = useState("Good Morning")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
    setMounted(true)
  }, [])

  return (
    <Card className="p-3 sm:p-4 md:p-6 bg-card border border-border/50 shadow-sm">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Top Section - Left Side */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#1E293B] dark:text-foreground leading-tight">
            {mounted ? greeting : "Welcome"}, {userName}
          </h1>
          <p className="text-[13px] sm:text-sm text-[#64748B] italic leading-relaxed">
            {"\"Consistency compounds. Protect capital first.\""}
          </p>
        </div>

        {/* Bottom Section - Flex column on mobile, row on desktop */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            className="border-[#E2E8F0] text-[#1E293B] dark:text-foreground hover:bg-[#F8FAFC] dark:hover:bg-accent-blue-subtle dark:hover:text-accent-blue text-xs sm:text-sm w-full sm:w-auto"
            onClick={() => router.push("/dashboard/monthly?month=march")}
          >
            <span className="hidden sm:inline">Monthly Performance Overview</span>
            <span className="sm:hidden">Performance</span>
            <ChevronRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <div className="flex items-center gap-2" aria-label="Last five trades">
            {recentTrades.map((trade, index) => {
              const isLast = index === recentTrades.length - 1
              const isWin = trade.result === "win"
              return (
                <div
                  key={trade.id}
                  className={`flex w-fit min-w-10 flex-none items-center justify-center rounded-md px-1.5 py-1 text-[10px] font-semibold sm:min-w-12 sm:px-2 sm:py-2 sm:text-xs ${isWin ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  aria-label={isWin ? "Win" : "Loss"}
                >
                  {isLast ? (isWin ? "Win" : "Loss") : (isWin ? "W" : "L")}
                </div>
              )
            })}
            {recentTrades.length === 0 && <p className="text-xs text-muted-foreground">No completed trades yet</p>}
          </div>
        </div>
      </div>
    </Card>
  )
}
