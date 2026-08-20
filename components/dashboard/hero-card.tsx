"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CheckCircle2 } from "lucide-react"

interface HeroCardProps {
  userName: string
  streakDays?: number
}

export function HeroCard({ userName, streakDays = 3 }: HeroCardProps) {
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
        <div className="flex flex-col gap-2 sm:gap-3">
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
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/dashboard/advanced-stats/streaks")}
            className="bg-[#ECFDF5] text-[#059669] border-0 hover:bg-[#D1FAE5] px-2 sm:px-3 py-1 sm:py-1.5 font-medium text-xs sm:text-sm whitespace-nowrap w-fit h-auto"
          >
            <CheckCircle2 className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Streak: {streakDays} disciplined days</span>
            <span className="sm:hidden">{streakDays} day streak</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}
