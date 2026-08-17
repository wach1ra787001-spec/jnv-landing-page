'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from './TagInput'
import type { TradeNote, NoteFormData } from './types'

interface NoteEditorModalProps {
  note?: TradeNote | null
  onClose: () => void
  onSaved: (note: TradeNote) => void
}

const EMPTY: NoteFormData = {
  title: '',
  pair: '',
  trade_ref: '',
  direction: '',
  outcome: 'general',
  pnl: '',
  note_date: new Date().toISOString().split('T')[0],
  tags: [],
  body: '',
}

export function NoteEditorModal({ note, onClose, onSaved }: NoteEditorModalProps) {
  const isEdit = !!note
  const [form, setForm] = useState<NoteFormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-populate when editing
  useEffect(() => {
    if (note) {
      setForm({
        title: note.title ?? '',
        pair: note.pair ?? note.symbol ?? '',
        trade_ref: note.trade_ref ?? note.trade_id ?? '',
        direction: (note.direction as NoteFormData['direction']) ?? '',
        outcome: note.outcome ?? 'general',
        pnl: note.net_pnl != null ? String(note.net_pnl) : '',
        note_date: (note.note_date ?? note.entry_time ?? note.created_at ?? '').split('T')[0],
        tags: note.tags ?? [],
        body: note.note ?? note.body ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setError('')
  }, [note])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (field: keyof NoteFormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.body.trim()) { setError('Note body is required.'); return }
    setError('')
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      pair: form.pair.trim(),
      trade_ref: form.trade_ref.trim(),
      direction: form.direction || null,
      outcome: form.outcome,
      pnl: form.pnl ? parseFloat(form.pnl) : null,
      note_date: form.note_date,
      tags: form.tags,
      body: form.body.trim(),
    }

    try {
      let res: Response
      if (isEdit && note) {
        res = await fetch(`/api/notes/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: payload.body, ...payload }),
        })
      } else {
        res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: payload.body, trade_id: payload.trade_ref || 'standalone', ...payload }),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save note.')
        return
      }

      const saved = await res.json()
      // Merge form fields into returned object for immediate UI update
      onSaved({
        ...saved,
        title: payload.title,
        symbol: payload.pair || saved.symbol,
        direction: (payload.direction as TradeNote['direction']) ?? saved.direction,
        outcome: payload.outcome,
        net_pnl: payload.pnl ?? saved.net_pnl,
        note_date: payload.note_date,
        tags: payload.tags,
        note: payload.body,
        body: payload.body,
        trade_ref: payload.trade_ref,
      })
      onClose()
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? 'Edit note' : 'New note'}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Title <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g. Breakout trade on GBP/USD"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            {/* Pair / Trade ID row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Pair / Instrument</label>
                <Input
                  placeholder="e.g. EURUSD"
                  value={form.pair}
                  onChange={e => set('pair', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Trade ID (optional)</label>
                <Input
                  placeholder="Trade reference"
                  value={form.trade_ref}
                  onChange={e => set('trade_ref', e.target.value)}
                />
              </div>
            </div>

            {/* Direction / Outcome / P&L row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Direction</label>
                <select
                  value={form.direction}
                  onChange={e => set('direction', e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">– none –</option>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Outcome</label>
                <select
                  value={form.outcome}
                  onChange={e => set('outcome', e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="general">General</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">P&L</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pnl}
                  onChange={e => set('pnl', e.target.value)}
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input
                type="date"
                value={form.note_date}
                onChange={e => set('note_date', e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <TagInput tags={form.tags} onChange={v => set('tags', v)} />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Note body <span className="text-destructive">*</span></label>
              <textarea
                placeholder="Write your trade reflection…"
                value={form.body}
                onChange={e => set('body', e.target.value)}
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                style={{ minHeight: '120px' }}
              />
            </div>

            {/* Inline error */}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: '#0A1628', color: '#fff' }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save note'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
