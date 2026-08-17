'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { NotesSummaryStats } from './NotesSummaryStats'
import { NotesFilterBar } from './NotesFilterBar'
import { NoteCard } from './NoteCard'
import { NoteViewModal } from './NoteViewModal'
import { NoteEditorModal } from './NoteEditorModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import type { TradeNote } from './types'

const PINNED_KEY = 'jnv_pinned_notes'

function loadPinned(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(PINNED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function savePinned(ids: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PINNED_KEY, JSON.stringify([...ids]))
}

type Modal = 'none' | 'view' | 'editor' | 'delete'

export function TradeNotesPage() {
  const [notes, setNotes] = useState<TradeNote[]>([])
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [symbolFilter, setSymbolFilter] = useState('all')

  // Active modal
  const [modal, setModal] = useState<Modal>('none')
  const [activeNote, setActiveNote] = useState<TradeNote | null>(null)

  // Load notes + pinned ids
  useEffect(() => {
    setPinnedIds(loadPinned())
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notes')
      if (res.ok) {
        const data: TradeNote[] = await res.json()
        // Map trades_with_journal fields to TradeNote shape
        setNotes(data.map(n => ({
          ...n,
          note: (n as any).post_trade_notes ?? n.note,
          body: (n as any).post_trade_notes ?? n.note,
          tags: Array.isArray(n.tags) ? n.tags : (n as any).tag ? [(n as any).tag] : [],
          note_date: (n as any).entry_time ?? n.created_at,
          outcome: deriveOutcome(n),
        })))
      }
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  function deriveOutcome(n: TradeNote): 'win' | 'loss' | 'general' {
    if ((n.net_pnl ?? 0) > 0) return 'win'
    if ((n.net_pnl ?? 0) < 0) return 'loss'
    if (n.status === 'win') return 'win'
    if (n.status === 'loss') return 'loss'
    return 'general'
  }

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      savePinned(next)
      return next
    })
  }

  const handleDelete = async () => {
    if (!activeNote) return
    try {
      const res = await fetch(`/api/notes/${activeNote.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setNotes(prev => prev.filter(n => n.id !== activeNote.id))
      toast.success('Note deleted')
    } catch {
      toast.error('Failed to delete note')
    } finally {
      setModal('none')
      setActiveNote(null)
    }
  }

  const handleSaved = (saved: TradeNote) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...prev[idx], ...saved }
        return next
      }
      return [{ ...saved, outcome: deriveOutcome(saved) }, ...prev]
    })
  }

  // All distinct symbols for filter
  const symbols = useMemo(() => {
    const set = new Set(notes.map(n => n.symbol).filter(Boolean) as string[])
    return [...set].sort()
  }, [notes])

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return notes.filter(n => {
      const body = n.note ?? n.body ?? ''
      const matchSearch =
        !q ||
        (n.title ?? '').toLowerCase().includes(q) ||
        body.toLowerCase().includes(q) ||
        (n.symbol ?? '').toLowerCase().includes(q)
      const matchOutcome =
        outcomeFilter === 'all' || n.outcome === outcomeFilter
      const matchSymbol =
        symbolFilter === 'all' || n.symbol === symbolFilter
      return matchSearch && matchOutcome && matchSymbol
    })
  }, [notes, search, outcomeFilter, symbolFilter])

  // Sort: pinned first, then by date desc
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ap = pinnedIds.has(a.id)
      const bp = pinnedIds.has(b.id)
      if (ap && !bp) return -1
      if (!ap && bp) return 1
      const da = new Date(a.note_date ?? a.created_at ?? 0).getTime()
      const db = new Date(b.note_date ?? b.created_at ?? 0).getTime()
      return db - da
    })
  }, [filtered, pinnedIds])

  const openView = (note: TradeNote) => { setActiveNote(note); setModal('view') }
  const openEdit = (note: TradeNote) => { setActiveNote(note); setModal('editor') }
  const openDelete = (note: TradeNote) => { setActiveNote(note); setModal('delete') }
  const openNew = () => { setActiveNote(null); setModal('editor') }
  const closeModal = () => { setModal('none'); setActiveNote(null) }

  // ─── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <NotesSummaryStats notes={notes} pinnedIds={pinnedIds} />

      {/* Filter bar */}
      <NotesFilterBar
        search={search}
        onSearchChange={setSearch}
        outcome={outcomeFilter}
        onOutcomeChange={setOutcomeFilter}
        symbol={symbolFilter}
        onSymbolChange={setSymbolFilter}
        symbols={symbols}
        onNewNote={openNew}
      />

      {/* Grid or empty states */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <StickyNote className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No notes yet. Write your first trade reflection.</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <p className="text-sm text-muted-foreground">No notes match your filters.</p>
          <button
            className="text-xs text-primary underline"
            onClick={() => { setSearch(''); setOutcomeFilter('all'); setSymbolFilter('all') }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {sorted.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              isPinned={pinnedIds.has(note.id)}
              onPin={() => togglePin(note.id)}
              onEdit={() => openEdit(note)}
              onDelete={() => openDelete(note)}
              onClick={() => openView(note)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'view' && activeNote && (
        <NoteViewModal
          note={activeNote}
          onClose={closeModal}
          onEdit={() => { setModal('editor') }}
        />
      )}
      {modal === 'editor' && (
        <NoteEditorModal
          note={activeNote}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
      {modal === 'delete' && activeNote && (
        <DeleteConfirmModal
          noteTitle={activeNote.title ?? activeNote.symbol ?? 'this note'}
          onCancel={closeModal}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
