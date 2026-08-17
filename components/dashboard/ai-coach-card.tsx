"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Sparkles } from "lucide-react"

export function AICoachCard() {
  return (
    <Card className="p-6 bg-card border border-[#E2E8F0] shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[#EFF6FF]">
          <Bot className="h-6 w-6 text-[#1E40AF]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1E293B] dark:text-foreground">
          Consult AI Coach
        </h3>
      </div>
      
      <p className="text-[#64748B] text-sm leading-relaxed mb-6 flex-1">
        Get personalized insights based on your trading patterns. Our AI analyzes your 
        performance data to identify strengths, weaknesses, and opportunities for improvement.
      </p>
      
      <Button 
        className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-medium py-5"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Analyze My Performance
      </Button>
    </Card>
  )
}
