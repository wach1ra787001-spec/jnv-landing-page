'use client'

import { useEffect } from 'react'
import { X, ArrowUp, ArrowDown, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TradeNote } from './types'

interface NoteViewModalProps {
  note: TradeNote
  onClose: () => void
  onEdit: () => void
}

export function NoteViewModal({ note, onClose, onEdit }: NoteViewModalProps) {
  const pnl = note.net_pnl ?? note.pnl ?? 0
  const isWin = pnl > 0
  const isLoss = pnl < 0
  const outcome = note.outcome ?? (isWin ? 'win' : isLoss ? 'loss' : 'general')
  const body = note.note ?? note.body ?? ''
  const noteDate = note.note_date ?? note.entry_time ?? note.created_at

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border shrink-0">
          <div className="flex-1 min-w-0 pr-4 space-y-2">
            {note.title && (
              <h2 className="text-base font-semibold text-foreground">{note.title}</h2>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {note.direction && (
                <span className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  note.direction === 'long'
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                )}>
                  {note.direction === 'long' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {note.direction === 'long' ? 'Long' : 'Short'}
                </span>
              )}
              {outcome === 'win' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">Win</span>
              )}
              {outcome === 'loss' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">Loss</span>
              )}
              {outcome === 'general' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">General</span>
              )}
              {note.symbol && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{note.symbol}</span>
              )}
              {pnl !== 0 && (
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', isWin ? 'text-emerald-500' : 'text-red-500')}>
                  {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                </span>
              )}
              {(note.tags ?? []).map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">{t}</span>
              ))}
            </div>

            {/* Date + trade ref */}
            <div className="flex gap-3 text-xs text-muted-foreground">
              {noteDate && (
                <span>{new Date(noteDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              )}
              {note.trade_ref && <span>Ref: {note.trade_ref}</span>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {body || <span className="text-muted-foreground italic">No content</span>}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit} style={{ backgroundColor: '#0A1628', color: '#fff' }} className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit note
          </Button>
        </div>
      </div>
    </div>
  )
}
