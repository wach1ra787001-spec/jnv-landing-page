'use client'

import { useState } from 'react'
import { useTradeNotes } from '@/hooks/use-trade-notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Loader2 } from 'lucide-react'

interface TradeNotesProps {
  tradeId: string
}

export function TradeNotes({ tradeId }: TradeNotesProps) {
  const { notes, isLoading, error, addNote } = useTradeNotes(tradeId)
  const [newNote, setNewNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsAdding(true)
    const result = await addNote(newNote)
    if (result) {
      setNewNote('')
    }
    setIsAdding(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddNote()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Notes Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">
          Trade Notes ({notes.length})
        </h3>
      </div>

      {/* Add Note Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a note about this trade..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isAdding}
          className="bg-background"
        />
        <Button
          onClick={handleAddNote}
          disabled={!newNote.trim() || isAdding}
          size="sm"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Add'
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="p-4 bg-secondary/50 rounded-lg text-center text-sm text-muted-foreground">
          No notes yet. Add one to start building your trading journal.
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-secondary/50 rounded-lg border border-border"
            >
              <p className="text-foreground text-sm mb-2">{note.note}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
