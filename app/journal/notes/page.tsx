'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { appToast } from '@/lib/toast-utils'

interface Note {
  id: string
  title: string
  content: Record<string, any>
  word_count: number
  created_at: string
  updated_at: string
  trade_id?: string
}

export default function NotesListPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredNotes(filtered)
  }, [searchTerm, notes])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('[v0] Error fetching notes:', error)
      appToast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const createNewNote = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          content: { type: 'doc', content: [] },
          wordCount: 0,
        }),
      })

      if (response.ok) {
        const newNote = await response.json()
        router.push(`/app/journal/notes/${newNote.id}`)
      }
    } catch (error) {
      console.error('[v0] Error creating note:', error)
      appToast.error('Failed to create note')
    }
  }

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== id))
        appToast.success('Note deleted')
      }
    } catch (error) {
      console.error('[v0] Error deleting note:', error)
      appToast.error('Failed to delete note')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  if (loading) {
    return <div className="p-8 text-center">Loading notes...</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Notes</h1>
        <Button onClick={createNewNote} className="gap-2">
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {searchTerm ? 'No notes found' : 'No notes yet'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try a different search' : 'Create your first note to get started'}
          </p>
          {!searchTerm && (
            <Button onClick={createNewNote} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Note
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="p-4 bg-card border-border hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/app/journal/notes/${note.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNote(note.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                {note.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {note.word_count} words
              </p>
              <p className="text-xs text-muted-foreground">
                Edited {formatDate(note.updated_at)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
