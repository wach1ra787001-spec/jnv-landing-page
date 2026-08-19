'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X, Upload, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tradeData: any) => Promise<void>
  editingTrade?: any
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_EMOTIONS = ['Calm', 'Confident', 'Anxious', 'Excited']

const DEFAULT_FORM = {
  symbol:        '',
  direction:     'buy' as 'buy' | 'sell',
  entry_price:   '',
  stop_loss:     '',
  take_profit:   '',
  lot_size:      '',
  open_time:     '',
  close_time:    '',
  exit_price:    '',
  status:        'open' as 'open' | 'closed' | 'cancelled',
  pnl:           '',
  pnl_percent:   '',
  r_multiple:    '',
  risk_amount:   '',
  strategy:      '',
  emotion_before:'',
  notes:         '',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Map form direction ('buy'|'sell') → DB direction ('long'|'short') */
const toDbDirection = (d: string) => d === 'buy' ? 'long' : 'short'

/** Map DB direction ('long'|'short') → form direction ('buy'|'sell') */
const toFormDirection = (d: string): 'buy' | 'sell' =>
  d === 'long' ? 'buy' : d === 'short' ? 'sell' : 'buy'

/**
 * Calculate P&L for a forex/metals trade.
 * Uses a 100,000 unit standard lot for forex pairs.
 * For XAUUSD (gold) the contract size is 100 oz — handled via symbol check.
 */
const calcPnL = (
  direction: string,
  entry: number,
  exit: number,
  lotSize: number,
  symbol: string
): { pnl: number; percent: number } => {
  const isGold = symbol.toUpperCase().includes('XAU')
  const contractSize = isGold ? 100 : 100_000
  const priceDiff = direction === 'buy' ? exit - entry : entry - exit
  const pnl = priceDiff * lotSize * contractSize
  const invested = entry * lotSize * contractSize
  const percent = invested !== 0 ? (pnl / invested) * 100 : 0
  return {
    pnl:     parseFloat(pnl.toFixed(2)),
    percent: parseFloat(percent.toFixed(4)),
  }
}

/** Calculate risk:reward ratio */
const calcRR = (entry: number, sl: number, tp: number): number => {
  const risk   = Math.abs(entry - sl)
  const reward = Math.abs(tp - entry)
  if (risk === 0) return 0
  return parseFloat((reward / risk).toFixed(2))
}

/** Upload a single file to Vercel Blob and return the URL */
const uploadScreenshot = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  
  console.log('[v0] Uploading file to /api/upload:', file.name)
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
  
  console.log('[v0] Upload response status:', response.status)
  if (!response.ok) {
    const error = await response.json()
    console.error('[v0] Upload error response:', error)
    throw new Error(error.error || 'Upload failed')
  }
  
  const data = await response.json()
  console.log('[v0] Upload successful. Returned URL:', data.url)
  return data.url
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function TradeModal({ isOpen, onClose, onSubmit, editingTrade }: TradeModalProps) {
  const [formData, setFormData]               = useState(DEFAULT_FORM)
  const [errors, setErrors]                   = useState<Record<string, string>>({})
  const [screenshots, setScreenshots]         = useState<File[]>([])
  const [isDragging, setIsDragging]           = useState(false)
  const [playbooks, setPlaybooks]             = useState<any[]>([])
  const [emotions, setEmotions]               = useState<string[]>(DEFAULT_EMOTIONS)
  const [showEmotionSettings, setShowEmotionSettings] = useState(false)
  const [customEmotion, setCustomEmotion]     = useState('')
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const fileInputRef                          = useRef<HTMLInputElement>(null)
  const abortRef                              = useRef<AbortController | null>(null)

  // ── Populate form when modal opens ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    if (editingTrade) {
      setFormData({
        symbol:         editingTrade.symbol ?? '',
        direction:      toFormDirection(editingTrade.direction ?? ''),
        entry_price:    editingTrade.entry_price?.toString() ?? '',
        stop_loss:      editingTrade.stop_loss?.toString() ?? '',
        take_profit:    editingTrade.take_profit?.toString() ?? '',
        lot_size:       (editingTrade.lot_size ?? editingTrade.quantity)?.toString() ?? '',
        open_time:      editingTrade.entry_time
                          ? new Date(editingTrade.entry_time).toISOString().slice(0, 16)
                          : '',
        close_time:     editingTrade.exit_time
                          ? new Date(editingTrade.exit_time).toISOString().slice(0, 16)
                          : '',
        exit_price:     editingTrade.exit_price?.toString() ?? '',
        status:         (editingTrade.status?.toLowerCase() ?? 'open') as 'open' | 'closed' | 'cancelled',
        pnl:            editingTrade.pnl?.toString() ?? '',
        pnl_percent:    editingTrade.pnl_percent?.toString() ?? '',
        r_multiple:     editingTrade.r_multiple?.toString() ?? '',
        risk_amount:    editingTrade.risk_amount?.toString() ?? '',
        strategy:       editingTrade.strategy ?? '',
        emotion_before: editingTrade.emotion_before ?? '',
        notes:          editingTrade.notes ?? '',
      })
    } else {
      setFormData({
        ...DEFAULT_FORM,
        open_time: new Date().toISOString().slice(0, 16),
      })
    }

    setScreenshots([])
    setErrors({})

    // Fetch playbooks with abort safety
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    fetch('/api/playbooks', { signal: abortRef.current.signal })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPlaybooks(data ?? []))
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })

    return () => abortRef.current?.abort()
  }, [isOpen, editingTrade])

  // ── Derived calculations ───────────────────────────────────────────────────
  const recalcRR = (data = formData) => {
    const e  = parseFloat(data.entry_price)
    const sl = parseFloat(data.stop_loss)
    const tp = parseFloat(data.take_profit)
    if (!e || !sl || !tp) return
    const rr = calcRR(e, sl, tp)
    setFormData(prev => ({ ...prev, r_multiple: rr.toString() }))
  }

  const recalcPnL = (data = formData) => {
    const entry = parseFloat(data.entry_price)
    const exit  = parseFloat(data.exit_price)
    const lot   = parseFloat(data.lot_size)
    if (!entry || !exit || !lot) return
    const { pnl, percent } = calcPnL(data.direction, entry, exit, lot, data.symbol)
    setFormData(prev => ({
      ...prev,
      pnl:         pnl.toString(),
      pnl_percent: percent.toString(),
    }))
  }

  const set = (field: keyof typeof DEFAULT_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFormData(prev => ({ ...prev, [field]: e.target.value }))

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!formData.symbol.trim())   e.symbol      = 'Symbol is required'
    if (!formData.entry_price)     e.entry_price = 'Entry price is required'
    if (!formData.stop_loss)       e.stop_loss   = 'Stop loss is required'
    if (!formData.take_profit)     e.take_profit = 'Take profit is required'
    if (!formData.lot_size)        e.lot_size    = 'Lot size is required'
    if (!formData.open_time)       e.open_time   = 'Open time is required'

    if (formData.status === 'closed') {
      if (!formData.close_time) e.close_time = 'Close time required for closed trades'
      if (!formData.exit_price) e.exit_price = 'Exit price required for closed trades'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isSubmitting) return
    setIsSubmitting(true)

    try {
      // Upload screenshots first
      let screenshotUrls: string[] = []
      if (screenshots.length > 0) {
        console.log('[v0] Starting screenshot upload for', screenshots.length, 'files')
        const uploadPromises = screenshots.map((file, idx) => {
          console.log(`[v0] Uploading screenshot ${idx + 1}:`, file.name, file.size, file.type)
          return uploadScreenshot(file)
        })
        screenshotUrls = await Promise.all(uploadPromises)
        console.log('[v0] All screenshots uploaded. URLs:', screenshotUrls)
      } else {
        console.log('[v0] No screenshots to upload')
      }

      const tradeData: Record<string, any> = {
        // DB-mapped fields
        symbol:       formData.symbol.toUpperCase().trim(),
        direction:    toDbDirection(formData.direction),   // ✅ 'long' | 'short'
        entry_price:  parseFloat(formData.entry_price),
        stop_loss:    parseFloat(formData.stop_loss),
        take_profit:  parseFloat(formData.take_profit),
        quantity:     parseFloat(formData.lot_size),       // ✅ primary qty column
        lot_size:     parseFloat(formData.lot_size),
        entry_time:   new Date(formData.open_time).toISOString(),
        exit_time:    formData.close_time                  // ✅ correct column name
                        ? new Date(formData.close_time).toISOString()
                        : null,
        exit_price:   formData.exit_price ? parseFloat(formData.exit_price) : null,
        status:       formData.status,
        pnl:          formData.pnl ? parseFloat(formData.pnl) : null,
        pnl_percent:  formData.pnl_percent ? parseFloat(formData.pnl_percent) : null,
        r_multiple:   formData.r_multiple ? parseFloat(formData.r_multiple) : null,
        risk_amount:  formData.risk_amount ? parseFloat(formData.risk_amount) : null,
        strategy:     formData.strategy || null,
        setup_type:   formData.strategy || null,
        source:       'manual',                            // ✅ satisfies check constraint
        notes:        formData.notes || null,
        emotion_before: formData.emotion_before || null,
        screenshot_urls: screenshotUrls,                   // ✅ uploaded screenshot URLs
      }
      
      console.log('[v0] Complete trade data to be saved:', tradeData)

      // Preserve id when editing
      if (editingTrade?.id) tradeData.id = editingTrade.id

      await onSubmit(tradeData)
      onClose()
    } catch (err) {
      console.error('TradeModal submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Screenshot handlers ────────────────────────────────────────────────────
  const addFiles = (files: FileList | null) => {
    if (!files) return
    setScreenshots(prev => [...prev, ...Array.from(files)])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const removeScreenshot = (idx: number) =>
    setScreenshots(prev => prev.filter((_, i) => i !== idx))

  // ── Emotion helpers ────────────────────────────────────────────────────────
  const addCustomEmotion = () => {
    const val = customEmotion.trim()
    if (val && !emotions.includes(val)) {
      setEmotions(prev => [...prev, val])
      setCustomEmotion('')
    }
  }

  const isClosed = formData.status !== 'open'

  if (!isOpen) return null

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 border-b border-border/50 bg-background px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {editingTrade ? 'Edit Trade' : 'Log New Trade'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── Two-column grid ── */}
          <div className="grid grid-cols-2 gap-6">

            {/* Left column */}
            <div className="space-y-4">

              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <Input
                  placeholder="e.g. EURUSD, XAUUSD"
                  value={formData.symbol}
                  onChange={set('symbol')}
                  className={cn(errors.symbol && 'border-red-500')}
                />
                {errors.symbol && <p className="text-xs text-red-600 mt-1">{errors.symbol}</p>}
              </div>

              {/* Direction toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Direction</label>
                <div className="flex gap-2">
                  {(['buy', 'sell'] as const).map(dir => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, direction: dir }))}
                      className={cn(
                        'flex-1 py-2 px-3 rounded font-medium transition-colors uppercase',
                        formData.direction === dir
                          ? dir === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      )}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Price */}
              <div>
                <label className="block text-sm font-medium mb-1">Entry Price</label>
                <Input
                  type="number" step="0.00001" placeholder="0.00000"
                  value={formData.entry_price}
                  onChange={set('entry_price')}
                  onBlur={() => { recalcRR(); recalcPnL() }}
                  className={cn(errors.entry_price && 'border-red-500')}
                />
                {errors.entry_price && <p className="text-xs text-red-600 mt-1">{errors.entry_price}</p>}
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-sm font-medium mb-1">Stop Loss</label>
                <Input
                  type="number" step="0.00001" placeholder="0.00000"
                  value={formData.stop_loss}
                  onChange={set('stop_loss')}
                  onBlur={() => recalcRR()}
                  className={cn(errors.stop_loss && 'border-red-500')}
                />
                {errors.stop_loss && <p className="text-xs text-red-600 mt-1">{errors.stop_loss}</p>}
              </div>

              {/* Take Profit */}
              <div>
                <label className="block text-sm font-medium mb-1">Take Profit</label>
                <Input
                  type="number" step="0.00001" placeholder="0.00000"
                  value={formData.take_profit}
                  onChange={set('take_profit')}
                  onBlur={() => recalcRR()}
                  className={cn(errors.take_profit && 'border-red-500')}
                />
                {errors.take_profit && <p className="text-xs text-red-600 mt-1">{errors.take_profit}</p>}
              </div>

              {/* Lot Size */}
              <div>
                <label className="block text-sm font-medium mb-1">Lot Size</label>
                <Input
                  type="number" step="0.01" placeholder="0.01"
                  value={formData.lot_size}
                  onChange={set('lot_size')}
                  onBlur={() => recalcPnL()}
                  className={cn(errors.lot_size && 'border-red-500')}
                />
                {errors.lot_size && <p className="text-xs text-red-600 mt-1">{errors.lot_size}</p>}
              </div>

            </div>{/* ← closes left column */}

            {/* Right column */}
            <div className="space-y-4">

              {/* Open Time */}
              <div>
                <label className="block text-sm font-medium mb-1">Open Time</label>
                <Input
                  type="datetime-local"
                  value={formData.open_time}
                  onChange={set('open_time')}
                  className={cn(errors.open_time && 'border-red-500')}
                />
                {errors.open_time && <p className="text-xs text-red-600 mt-1">{errors.open_time}</p>}
              </div>

              {/* Close Time */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Close Time
                  {!isClosed && <span className="text-muted-foreground text-xs ml-1">(Optional)</span>}
                </label>
                <Input
                  type="datetime-local"
                  value={formData.close_time}
                  onChange={set('close_time')}
                  disabled={!isClosed}
                  className={cn(errors.close_time && 'border-red-500')}
                />
                {errors.close_time && <p className="text-xs text-red-600 mt-1">{errors.close_time}</p>}
              </div>

              {/* Exit Price */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Exit Price
                  {!isClosed && <span className="text-muted-foreground text-xs ml-1">(Optional)</span>}
                </label>
                <Input
                  type="number" step="0.00001" placeholder="0.00000"
                  value={formData.exit_price}
                  onChange={set('exit_price')}
                  onBlur={() => recalcPnL()}
                  disabled={!isClosed}
                  className={cn(errors.exit_price && 'border-red-500')}
                />
                {errors.exit_price && <p className="text-xs text-red-600 mt-1">{errors.exit_price}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      status: e.target.value as typeof formData.status,
                    }))
                  }
                  className="w-full px-3 py-2 bg-input border border-border/50 rounded text-foreground text-sm"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* P&L */}
              <div>
                <label className="block text-sm font-medium mb-1">P&L</label>
                <Input
                  type="number" step="0.01" placeholder="Auto-calculated or manual"
                  value={formData.pnl}
                  onChange={set('pnl')}
                  className={cn(
                    formData.pnl && parseFloat(formData.pnl) > 0 && 'text-green-600',
                    formData.pnl && parseFloat(formData.pnl) < 0 && 'text-red-600',
                  )}
                />
                {formData.pnl_percent && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {parseFloat(formData.pnl_percent).toFixed(2)}% return
                  </p>
                )}
              </div>

              {/* Strategy */}
              <div>
                <label className="block text-sm font-medium mb-1">Strategy</label>
                {playbooks.length > 0 ? (
                  <select
                    value={formData.strategy}
                    onChange={set('strategy')}
                    className="w-full px-3 py-2 bg-input border border-border/50 rounded text-foreground text-sm"
                  >
                    <option value="">Select playbook / strategy...</option>
                    {playbooks.map(p => (
                      <option key={p.id} value={p.title}>{p.title}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="e.g. London Breakout"
                    value={formData.strategy}
                    onChange={set('strategy')}
                  />
                )}
              </div>

            </div>{/* ← closes right column */}

          </div>{/* ← closes two-column grid */}

          {/* ── Trade Details Card ── */}
          <Card className="p-4 bg-muted/30 border border-border/50">
            <h3 className="text-sm font-semibold mb-4">Trade Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Risk : Reward (auto)
                </label>
                <Input
                  value={formData.r_multiple ? `1 : ${formData.r_multiple}` : ''}
                  readOnly
                  placeholder="Fill entry, SL & TP"
                  className="text-sm bg-muted/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  P&L % (auto)
                </label>
                <Input
                  value={formData.pnl_percent ? `${parseFloat(formData.pnl_percent).toFixed(4)}%` : ''}
                  readOnly
                  placeholder="Fill entry, exit & lot"
                  className={cn(
                    'text-sm bg-muted/50',
                    formData.pnl_percent && parseFloat(formData.pnl_percent) > 0 && 'text-green-600',
                    formData.pnl_percent && parseFloat(formData.pnl_percent) < 0 && 'text-red-600',
                  )}
                />
              </div>
            </div>
          </Card>

          {/* ── Journal Entry Card ── */}
          <Card className="p-4 bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Journal Entry</h3>
              <button
                type="button"
                onClick={() => setShowEmotionSettings(v => !v)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {showEmotionSettings && (
              <div className="mb-4 p-3 bg-background rounded border border-border/50">
                <label className="block text-xs font-medium mb-2">Add Custom Emotion</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Chaotic, Determined…"
                    value={customEmotion}
                    onChange={e => setCustomEmotion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomEmotion())}
                    className="text-xs"
                  />
                  <Button type="button" size="sm" onClick={addCustomEmotion} className="h-9">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {emotions.map(em => (
                    <span key={em} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      {em}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Emotion Before
                </label>
                <select
                  value={formData.emotion_before}
                  onChange={set('emotion_before')}
                  className="w-full px-3 py-2 bg-input border border-border/50 rounded text-foreground text-sm"
                >
                  <option value="">Select emotion…</option>
                  {emotions.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Risk Amount ($)
                </label>
                <Input
                  type="number" step="0.01" placeholder="e.g. 50.00"
                  value={formData.risk_amount}
                  onChange={set('risk_amount')}
                />
              </div>
            </div>
          </Card>

          {/* ── Notes ── */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="What was your reasoning? What did you learn?"
              value={formData.notes}
              onChange={set('notes')}
              className="w-full px-3 py-2 bg-input border border-border/50 rounded text-foreground text-sm resize-none"
            />
          </div>

          {/* ── Screenshots (single block) ── */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Trade Screenshots <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>

            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-primary/50'
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Drop screenshots or click to browse</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10 MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={e => addFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {screenshots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {screenshots.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-24 object-cover rounded border border-border/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(idx)}
                      className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                    <p className="text-xs text-muted-foreground truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent-blue hover:bg-accent-blue-strong min-w-[120px]"
            >
              {isSubmitting
                ? 'Saving…'
                : editingTrade ? 'Update Trade' : 'Save Trade'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
