'use client'

import { Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
}

export function SaveStatus({ status }: SaveStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {status === 'saving' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600">All changes saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">Error saving</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            Retry
          </Button>
        </>
      )}
    </div>
  )
}
