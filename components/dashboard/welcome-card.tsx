"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Sun, Moon, CloudSun } from "lucide-react"

interface WelcomeCardProps {
  userName: string
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours()
  if (hour < 12) {
    return { text: "Good Morning", icon: <Sun className="w-6 h-6 text-amber-500" /> }
  } else if (hour < 17) {
    return { text: "Good Afternoon", icon: <CloudSun className="w-6 h-6 text-orange-500" /> }
  } else {
    return { text: "Good Evening", icon: <Moon className="w-6 h-6 text-indigo-400" /> }
  }
}

export function WelcomeCard({ userName }: WelcomeCardProps) {
  const greeting = getGreeting()

  return (
    <Card className="border border-border bg-card h-full">
      <CardContent className="flex flex-col items-center justify-center h-full py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
          <span className="text-xl font-semibold text-accent-foreground">
            {userName[0]?.toUpperCase() || "T"}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          {greeting.icon}
          <h1 className="text-xl font-semibold text-foreground">
            {greeting.text}, {userName}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Profitability starts from accountability.
        </p>
      </CardContent>
    </Card>
  )
}
