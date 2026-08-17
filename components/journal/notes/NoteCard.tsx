'use client'

import { Pin, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TradeNote } from './types'

interface NoteCardProps {
  note: TradeNote
  isPinned: boolean
  onPin: () => void
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
}

export function NoteCard({ note, isPinned, onPin, onEdit, onDelete, onClick }: NoteCardProps) {
  const pnl = note.net_pnl ?? 0
  const isWin = pnl > 0
  const isLoss = pnl < 0

  // Derive outcome from status or pnl
  const outcome: 'win' | 'loss' | 'general' =
    note.outcome === 'win' || isWin ? 'win'
    : note.outcome === 'loss' || isLoss ? 'loss'
    : 'general'

  const visibleTags = (note.tags ?? []).slice(0, 2)
  const body = note.note ?? note.body ?? ''
  const noteDate = note.note_date ?? note.entry_time ?? note.created_at

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card transition-all cursor-pointer hover:shadow-md hover:border-primary/30',
        isPinned
          ? 'border-l-[3px] border-l-blue-500'
          : 'border-border'
      )}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Top row: badges + hover actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {/* Direction badge */}
            {note.direction && (
              <span className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                note.direction === 'long'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
              )}>
                {note.direction === 'long'
                  ? <ArrowUp className="w-3 h-3" />
                  : <ArrowDown className="w-3 h-3" />}
                {note.direction === 'long' ? 'Long' : 'Short'}
              </span>
            )}

            {/* Outcome badge */}
            {outcome === 'win' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                Win
              </span>
            )}
            {outcome === 'loss' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                Loss
              </span>
            )}
            {outcome === 'general' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                General
              </span>
            )}

            {/* Symbol badge */}
            {note.symbol && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {note.symbol}
              </span>
            )}

            {/* First 2 tags */}
            {visibleTags.map((t, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Hover action buttons */}
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <button
              className={cn(
                'h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors',
              )}
              onClick={onPin}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={cn('w-3.5 h-3.5', isPinned ? 'fill-blue-500 text-blue-500' : 'text-muted-foreground')} />
            </button>
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
              onClick={onEdit}
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>

        {/* Title */}
        {note.title && (
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">{note.title}</p>
        )}

        {/* 3-line clamped body preview */}
        <p
          className="text-sm text-muted-foreground leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {body || <span className="italic">No content</span>}
        </p>

        {/* Footer: date + P&L */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <span>
            {noteDate
              ? new Date(noteDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </span>
          {pnl !== 0 && (
            <span className={cn('font-semibold', isWin ? 'text-emerald-500' : 'text-red-500')}>
              {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
