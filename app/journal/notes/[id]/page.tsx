'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NoteEditor } from '@/components/NoteEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { appToast } from '@/lib/toast-utils'

interface NoteEditorPageProps {
  params: {
    id: string
  }
}

interface Note {
  id: string
  title: string
  content: Record<string, any>
  word_count: number
  trade_id?: string
}

export default function NoteEditorPage({ params }: NoteEditorPageProps) {
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNote()
  }, [params.id])

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes?id=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setNote(data)
      } else {
        appToast.error('Note not found')
        router.push('/app/journal/notes')
      }
    } catch (error) {
      console.error('[v0] Error fetching note:', error)
      appToast.error('Failed to load note')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (content: Record<string, any>, wordCount: number, title: string) => {
    try {
      const response = await fetch(`/api/notes?id=${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          wordCount,
        }),
      })

      if (!response.ok) {
        appToast.error('Failed to save note')
      }
    } catch (error) {
      console.error('[v0] Error saving note:', error)
      appToast.error('Failed to save note')
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading note...</div>
  }

  return (
    <div>
      <div className="fixed top-0 left-0 z-50 p-4 bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/app/journal/notes')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to notes
        </Button>
      </div>
      <NoteEditor
        initialContent={note?.content}
        noteId={note?.id}
        tradId={note?.trade_id}
        onSave={handleSave}
      />
    </div>
  )
}
