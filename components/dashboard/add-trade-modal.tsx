'use client'

import { useState, useEffect } from 'react'
import { appToast } from '@/lib/toast-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X, Loader2, Upload, FileImage, Copy, Settings, Plus, Zap } from 'lucide-react'

interface AddTradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tradeData: TradeData) => void
}

interface TradeData {
  symbol: string
  entryPrice: number
  exitPrice: number
  quantity: number
  direction: 'buy' | 'sell'
  entryDate: string
  exitDate: string
  stopLoss?: number
  takeProfit?: number
  riskRewardRatio?: number
  riskAmount?: number
  pnl?: number
  pnlPercent?: number
  emotionBefore?: string
  emotionDuring?: string
  setupType?: string
  notes?: string
  screenshots?: string[]
}

export function AddTradeModal({ isOpen, onClose, onSubmit }: AddTradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [playbooks, setPlaybooks] = useState<any[]>([])
  const [showEmotionSettings, setShowEmotionSettings] = useState(false)
  const [emotionsBefore, setEmotionsBefore] = useState(['Calm', 'Confident', 'Anxious', 'Excited'])
  const [customEmotionInput, setCustomEmotionInput] = useState('')
  const [formData, setFormData] = useState<TradeData>({
    symbol: '',
    entryPrice: 0,
    exitPrice: 0,
    quantity: 0,
    direction: 'buy',
    entryDate: new Date().toISOString().split('T')[0],
    exitDate: new Date().toISOString().split('T')[0],
    stopLoss: undefined,
    takeProfit: undefined,
    riskRewardRatio: undefined,
    riskAmount: undefined,
    pnl: 0,
    pnlPercent: 0,
    emotionBefore: '',
    emotionDuring: '',
    setupType: '',
    notes: '',
    screenshots: [],
  })

  useEffect(() => {
    if (isOpen) {
      fetchPlaybooks()
    }
  }, [isOpen])

  const fetchPlaybooks = async () => {
    try {
      const response = await fetch('/api/playbooks')
      if (response.ok) {
        const data = await response.json()
        setPlaybooks(data || [])
      }
    } catch (error) {
      console.error('[v0] Error fetching playbooks:', error)
    }
  }

  const calculatePnL = () => {
    const entry = parseFloat(formData.entryPrice?.toString() || '0')
    const exit = parseFloat(formData.exitPrice?.toString() || '0')
    const qty = parseFloat(formData.quantity?.toString() || '0')
    
    if (!entry || !exit || !qty) return
    
    const pnl = formData.direction === 'buy' 
      ? (exit - entry) * qty
      : (entry - exit) * qty
    
    const pnlPercent = (pnl / (entry * qty)) * 100
    
    setFormData(prev => ({
      ...prev,
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercent: parseFloat(pnlPercent.toFixed(2))
    }))
  }

  const calculateRiskReward = () => {
    if (!formData.stopLoss || !formData.takeProfit || !formData.entryPrice) return
    
    const entry = parseFloat(formData.entryPrice.toString())
    const sl = parseFloat(formData.stopLoss.toString())
    const tp = parseFloat(formData.takeProfit.toString())
    
    const risk = Math.abs(entry - sl)
    const reward = Math.abs(tp - entry)
    const rr = reward / risk
    
    setFormData(prev => ({ ...prev, riskRewardRatio: parseFloat(rr.toFixed(2)) }))
  }

  const addCustomEmotion = () => {
    if (customEmotionInput.trim() && !emotionsBefore.includes(customEmotionInput)) {
      setEmotionsBefore([...emotionsBefore, customEmotionInput])
      setCustomEmotionInput('')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    let uploadedCount = 0
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setScreenshots([...screenshots, dataUrl])
        setFormData({ ...formData, screenshots: [...(formData.screenshots || []), dataUrl] })
        uploadedCount++
        if (uploadedCount === files.length) {
          appToast.screenshotsAdded(files.length)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    let uploadedCount = 0
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setScreenshots([...screenshots, dataUrl])
        setFormData({ ...formData, screenshots: [...(formData.screenshots || []), dataUrl] })
        uploadedCount++
        if (uploadedCount === files.length) {
          appToast.screenshotsAdded(files.length)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeScreenshot = (index: number) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index)
    setScreenshots(newScreenshots)
    setFormData({ ...formData, screenshots: newScreenshots })
    appToast.screenshotRemoved()
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onSubmit(formData)
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card border border-border/50 shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
          <h2 className="text-xl font-semibold text-foreground">Add Trade</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Symbol</label>
              <Input
                placeholder="EURUSD"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="bg-input border border-border/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'buy' | 'sell' })}
                className="w-full px-3 py-2 bg-input border border-border/50 rounded-md text-foreground"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Entry Price</label>
              <Input
                type="number"
                placeholder="1.0850"
                value={formData.entryPrice || ''}
                onChange={(e) => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) })}
                className="bg-input border border-border/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Exit Price</label>
              <Input
                type="number"
                placeholder="1.0900"
                value={formData.exitPrice || ''}
                onChange={(e) => setFormData({ ...formData, exitPrice: parseFloat(e.target.value) })}
                className="bg-input border border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
              <Input
                type="number"
                placeholder="1.0"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                onBlur={calculatePnL}
                className="bg-input border border-border/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Entry Date</label>
              <Input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                className="bg-input border border-border/50"
              />
            </div>
          </div>

          {/* Trade Details Card */}
          <Card className="p-4 bg-muted/30 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">Trade Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stop Loss</label>
                <Input
                  type="number"
                  placeholder="e.g., 1.0800"
                  value={formData.stopLoss || ''}
                  onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) })}
                  onBlur={calculateRiskReward}
                  className="bg-input border border-border/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Take Profit</label>
                <Input
                  type="number"
                  placeholder="e.g., 1.0950"
                  value={formData.takeProfit || ''}
                  onChange={(e) => setFormData({ ...formData, takeProfit: parseFloat(e.target.value) })}
                  onBlur={calculateRiskReward}
                  className="bg-input border border-border/50 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-medium text-muted-foreground">Calculations</h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  calculatePnL()
                  calculateRiskReward()
                }}
                className="gap-1 h-7 text-xs"
              >
                <Zap className="w-3 h-3" />
                Auto Calculate
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Risk:Reward Ratio</label>
                <Input
                  type="number"
                  placeholder="Auto-calculated"
                  value={formData.riskRewardRatio || ''}
                  disabled
                  className="bg-input border border-border/50 text-sm opacity-75"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-calculated from SL & TP</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">P&L (Auto-Calc)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.pnl || ''}
                  disabled
                  className={`bg-input border border-border/50 text-sm opacity-75 ${formData.pnl && formData.pnl > 0 ? 'text-green-600' : formData.pnl && formData.pnl < 0 ? 'text-red-600' : ''}`}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.pnlPercent?.toFixed(2)}% ({formData.pnl?.toFixed(2)})</p>
              </div>
            </div>
          </Card>

          {/* Journal Entry Card */}
          <Card className="p-4 bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Journal Entry</h3>
              <button
                onClick={() => setShowEmotionSettings(!showEmotionSettings)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {showEmotionSettings && (
              <div className="mb-4 p-3 bg-background rounded border border-border/50">
                <label className="block text-xs font-medium text-foreground mb-2">Add Custom Emotion</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., Chaotic, Determined..."
                    value={customEmotionInput}
                    onChange={(e) => setCustomEmotionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomEmotion()}
                    className="bg-input border border-border/50 text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={addCustomEmotion}
                    className="bg-primary hover:bg-primary/90 h-8"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {emotionsBefore.map((emotion) => (
                    <span
                      key={emotion}
                      className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Emotion Before</label>
                <select
                  value={formData.emotionBefore || ''}
                  onChange={(e) => setFormData({ ...formData, emotionBefore: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border/50 rounded-md text-foreground text-sm"
                >
                  <option value="">Select emotion...</option>
                  {emotionsBefore.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Setup Type</label>
                <select
                  value={formData.setupType || ''}
                  onChange={(e) => setFormData({ ...formData, setupType: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border/50 rounded-md text-foreground text-sm"
                >
                  <option value="">Select playbook/strategy...</option>
                  {playbooks.map((playbook) => (
                    <option key={playbook.id} value={playbook.title}>{playbook.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Exit Date</label>
            <Input
              type="date"
              value={formData.exitDate}
              onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
              className="bg-input border border-border/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
            <textarea
              placeholder="Trade notes, strategy, lessons..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border/50 rounded-md text-foreground placeholder:text-muted-foreground resize-none h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Trade Screenshots (Optional)</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 bg-muted/30 hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Drop screenshots or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                </div>
                <label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" asChild className="cursor-pointer gap-2 mt-2 h-8 text-xs">
                    <span>
                      <Upload className="w-3 h-3" />
                      Upload Screenshots
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {screenshots.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-foreground">{screenshots.length} screenshot{screenshots.length > 1 ? 's' : ''} added</p>
                <div className="grid grid-cols-3 gap-2">
                  {screenshots.map((src, idx) => (
                    <div key={idx} className="relative rounded-md overflow-hidden border border-border/50 group">
                      <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-20 object-cover" />
                      <button
                        onClick={() => removeScreenshot(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border/50 bg-muted/30 shrink-0">
          <Button onClick={onClose} variant="outline" className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1 gap-2 bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Adding...' : 'Add Trade'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
