'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface DeleteConfirmModalProps {
  noteTitle: string
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({ noteTitle, onCancel, onConfirm }: DeleteConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[380px] bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Delete note</h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">&quot;{noteTitle}&quot;</span>?
            This cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={onConfirm}
            style={{ backgroundColor: '#A32D2D', color: '#fff' }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
