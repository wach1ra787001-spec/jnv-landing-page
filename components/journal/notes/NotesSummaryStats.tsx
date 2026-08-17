'use client'

import { cn } from '@/lib/utils'

interface TradeNote {
  id: string
  net_pnl?: number
  status?: string
  isPinned?: boolean
}

interface NotesSummaryStatsProps {
  notes: TradeNote[]
  pinnedIds: Set<string>
}

export function NotesSummaryStats({ notes, pinnedIds }: NotesSummaryStatsProps) {
  const total = notes.length
  const pinned = pinnedIds.size
  const wins = notes.filter(n => (n.net_pnl ?? 0) > 0 || n.status === 'win').length
  const netPnl = notes.reduce((sum, n) => sum + (n.net_pnl ?? 0), 0)
  const isPositive = netPnl >= 0

  const stats = [
    { label: 'Total Notes', value: total, valueClass: 'text-foreground' },
    { label: 'Pinned', value: pinned, valueClass: 'text-foreground' },
    { label: 'Win Notes', value: wins, valueClass: 'text-emerald-500' },
    {
      label: 'Net P&L',
      value: `${isPositive ? '+' : ''}${netPnl.toFixed(2)}`,
      valueClass: isPositive ? 'text-blue-500' : 'text-red-500',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem' }}>
      {stats.map(stat => (
        <div key={stat.label} className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{stat.label}</span>
          <span className={cn('text-xl font-semibold', stat.valueClass)}>{stat.value}</span>
        </div>
      ))}
    </div>
  )
}
