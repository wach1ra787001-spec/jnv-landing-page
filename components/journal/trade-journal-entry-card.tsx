'use client'

import { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ChevronDown, ChevronUp, Camera, Save, Loader2, X, ImageIcon,
} from 'lucide-react'
import { appToast } from '@/lib/toast-utils'

interface Trade {
  id: string
  symbol: string
  direction: 'long' | 'short'
  entry_price: number
  exit_price: number | null
  lot_size: number
  pnl: number
  net_pnl: number
  entry_time: string
  exit_time: string | null
  status: string
  source: string
  screenshot_urls?: string[]
  strategy?: string
  setup_type?: string
}

interface TradeJournalEntryCardProps {
  trade: Trade
  defaultExpanded?: boolean
  onJournaled?: (tradeId: string) => void
}

export function TradeJournalEntryCard({
  trade,
  defaultExpanded = false,
  onJournaled,
}: TradeJournalEntryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [notes, setNotes] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>(trade.screenshot_urls ?? [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProfit = (trade.net_pnl ?? trade.pnl) >= 0
  const pnl = trade.net_pnl ?? trade.pnl

  const handleSaveNotes = async () => {
    if (!notes.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/trades/${trade.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: notes }),
      })
      if (!res.ok) throw new Error('Failed to save')
      appToast.notesSaved()
      setNotes('')
      onJournaled?.(trade.id)
    } catch {
      appToast.notesSaveFailed()
    } finally {
      setSaving(false)
    }
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    try {
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('files', f))

      const res = await fetch(`/api/trades/${trade.id}/screenshots`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setScreenshots(prev => [...prev, ...(data.urls ?? [])])
      appToast.screenshotsAdded(data.urls?.length ?? 1)
    } catch {
      appToast.uploadFailed()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveScreenshot = async (url: string) => {
    try {
      await fetch(`/api/trades/${trade.id}/screenshots`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      setScreenshots(prev => prev.filter(u => u !== url))
      appToast.screenshotRemoved()
    } catch {
      appToast.error('Failed to remove screenshot')
    }
  }

  return (
    <Card className="border border-border/50 overflow-hidden">
      {/* Trade header row */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Direction badge */}
        <Badge
          variant={trade.direction === 'long' ? 'default' : 'secondary'}
          className="shrink-0 text-xs px-2"
        >
          {trade.direction === 'long' ? 'Long' : 'Short'}
        </Badge>

        {/* Symbol */}
        <span className="font-mono font-semibold text-foreground">{trade.symbol}</span>

        {/* Times */}
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {trade.entry_time ? new Date(trade.entry_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>

        {/* P&L */}
        <span className={`ml-auto font-mono font-semibold text-sm shrink-0 ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
        </span>

        {/* Source badge */}
        {trade.source === 'csv' && (
          <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">CSV</Badge>
        )}

        {/* Status */}
        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
          trade.status === 'closed'
            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        }`}>
          {trade.status}
        </span>

        {/* Expand icon */}
        <span className="text-muted-foreground shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded journal panel */}
      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-4 bg-muted/10">
          {/* Trade details row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Entry</p>
              <p className="font-mono font-semibold text-foreground">{trade.entry_price}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Exit</p>
              <p className="font-mono font-semibold text-foreground">{trade.exit_price ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Lots</p>
              <p className="font-mono font-semibold text-foreground">{trade.lot_size}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Source</p>
              <p className="font-semibold text-foreground capitalize">{trade.source}</p>
            </div>
          </div>

          {/* Screenshots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-foreground">Screenshots</p>
              <label htmlFor={`sc-${trade.id}`} className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  id={`sc-${trade.id}`}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleScreenshotUpload}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" size="sm" className="gap-1.5 pointer-events-none" asChild>
                  <span>
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    {uploading ? 'Uploading...' : 'Add Screenshot'}
                  </span>
                </Button>
              </label>
            </div>

            {screenshots.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {screenshots.map((url, i) => (
                  <div key={i} className="relative group w-24 h-16 rounded border border-border overflow-hidden bg-muted">
                    <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(url)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5 text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No screenshots yet.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-medium text-foreground mb-1.5">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What happened? What did you do well? What could you improve?"
              rows={3}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={saving || !notes.trim()}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
