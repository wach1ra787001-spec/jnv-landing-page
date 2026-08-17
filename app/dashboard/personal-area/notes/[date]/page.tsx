'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Save, X } from 'lucide-react'

interface NoteState {
  title: string
  content: string
  isDirty: boolean
}

export default function NoteDatePage() {
  const router = useRouter()
  const params = useParams()
  const dateStr = params.date as string

  const [note, setNote] = useState<NoteState>({
    title: `Note for ${dateStr}`,
    content: 'Add your trading notes here...',
    isDirty: false,
  })

  const handleTitleChange = (newTitle: string) => {
    setNote({ ...note, title: newTitle, isDirty: true })
  }

  const handleContentChange = (newContent: string) => {
    setNote({ ...note, content: newContent, isDirty: true })
  }

  const handleSave = () => {
    // Save to database
    setNote({ ...note, isDirty: false })
    router.push('/dashboard/personal-area/notes')
  }

  const handleDiscard = () => {
    if (note.isDirty) {
      if (confirm('Discard unsaved changes?')) {
        router.push('/dashboard/personal-area/notes')
      }
    } else {
      router.push('/dashboard/personal-area/notes')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDiscard}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {dateStr}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDiscard}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Discard
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 bg-primary hover:bg-primary/90"
            disabled={!note.isDirty}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Note Title Editor */}
      <Card className="p-4 md:p-6 bg-card border border-border/50">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Note Title (Optional)
            </label>
            <input
              type="text"
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter note title..."
            />
          </div>
        </div>
      </Card>

      {/* Note Content Editor */}
      <Card className="p-4 md:p-6 bg-card border border-border/50">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Notes
            </label>
            <textarea
              value={note.content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 rounded-lg bg-input border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="Write your trading notes here..."
            />
          </div>
        </div>
      </Card>

      {/* Unsaved Changes Warning */}
      {note.isDirty && (
        <div className="fixed bottom-4 right-4 bg-amber-100 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 rounded-lg px-4 py-3 text-amber-900 dark:text-amber-100 text-sm">
          You have unsaved changes
        </div>
      )}
    </div>
  )
}
