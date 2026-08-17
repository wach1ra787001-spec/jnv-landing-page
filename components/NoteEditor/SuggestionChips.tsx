'use client'

import { Button } from '@/components/ui/button'
import { FileText, BarChart3, Calendar, BookOpen } from 'lucide-react'

interface SuggestionChipsProps {
  onSelect: (templateContent: string) => void
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const templates = [
    {
      id: 'trade-notes',
      label: 'Trade Notes',
      icon: FileText,
      content: `# Trade Notes — ${today}

**Symbol:** 
**Direction:** 
**Entry:** 
**Stop Loss:** 
**Take Profit:** 

## Pre-Trade Analysis
[Your analysis here]

## Trade Outcome
[What happened]

## Lessons Learned
[What to improve]`,
    },
    {
      id: 'weekly-review',
      label: 'Weekly Review',
      icon: BarChart3,
      content: `# Weekly Review — Week of ${today}

**Total P&L:** 
**Win Rate:** 
**Total Trades:** 

## What Went Well

## What Needs Improvement

## Goals for Next Week`,
    },
    {
      id: 'daily-journal',
      label: 'Daily Journal',
      icon: Calendar,
      content: `# Daily Journal — ${today}

**Market Conditions:** 
**Session:** 

## Pre-Market Plan

## Trades Taken

## End of Day Reflection`,
    },
    {
      id: 'more',
      label: 'More Templates',
      icon: BookOpen,
      content: '',
    },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {templates.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="outline"
          className="rounded-full gap-2 px-4 py-2"
          onClick={() => onSelect(templates.find(t => t.id === id)?.content || '')}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
