'use client'

import { Search, NotebookPen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NotesFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  outcome: string
  onOutcomeChange: (v: string) => void
  symbol: string
  onSymbolChange: (v: string) => void
  symbols: string[]
  onNewNote: () => void
}

export function NotesFilterBar({
  search,
  onSearchChange,
  outcome,
  onOutcomeChange,
  symbol,
  onSymbolChange,
  symbols,
  onNewNote,
}: NotesFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search notes…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Outcome filter */}
      <Select value={outcome} onValueChange={onOutcomeChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All outcomes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All outcomes</SelectItem>
          <SelectItem value="win">Win</SelectItem>
          <SelectItem value="loss">Loss</SelectItem>
          <SelectItem value="general">General</SelectItem>
        </SelectContent>
      </Select>

      {/* Symbol filter */}
      <Select value={symbol} onValueChange={onSymbolChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All symbols" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All symbols</SelectItem>
          {symbols.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* New note */}
      <Button
        onClick={onNewNote}
        className="ml-auto gap-2"
        style={{ backgroundColor: '#0A1628', color: '#fff' }}
      >
        <NotebookPen className="w-4 h-4" />
        New note
      </Button>
    </div>
  )
}
