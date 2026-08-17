'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function JournalPage() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/50 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Trade Journal</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Log your trades here</p>
          </div>
          <Link href="/dashboard/journal/new">
            <Button 
              className="w-full sm:w-auto gap-2 bg-[#0A1F44] hover:bg-[#071530] text-white"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Trade</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation to Trade History */}
      <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">View Your Saved Trades</h3>
            <p className="text-muted-foreground">All trades you log here will be saved and visible in your Trade History page.</p>
          </div>
          <Link href="/dashboard/trade-history">
            <Button className="gap-2">
              Go to Trade History
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
