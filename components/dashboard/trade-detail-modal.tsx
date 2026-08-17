"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ArrowDownRight, ArrowUpRight, Upload, Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Trade {
  id: string
  symbol: string
  direction: "long" | "short"
  entryPrice: number
  exitPrice: number
  quantity: number
  entryTime: string
  exitTime: string
  pnl: number
  pnlPercent: number
  status: "closed" | "open"
  screenshot_urls?: string[]
  notes?: string
  strategy?: string
}

interface TradeDetailModalProps {
  trade: Trade
  onClose: () => void
  onUpdate?: (updatedTrade: Trade) => void
}

export function TradeDetailModal({ trade, onClose, onUpdate }: TradeDetailModalProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [screenshots, setScreenshots] = useState<string[]>(trade.screenshot_urls || [])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    // Update screenshots when trade changes
    setScreenshots(trade.screenshot_urls || [])
  }, [trade.screenshot_urls])

  useEffect(() => {
    // Load TradingView Lightweight Charts library
    if (!window.TradingView && chartContainerRef.current) {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/lightweight-charts@4.0.0/dist/lightweight-charts.standalone.production.js"
      script.async = true
      script.onload = () => {
        if (chartContainerRef.current && window.TradingView) {
          initChart()
        }
      }
      document.head.appendChild(script)
    } else if (window.TradingView && chartContainerRef.current) {
      initChart()
    }
  }, [trade])

  const initChart = () => {
    if (!chartContainerRef.current || !window.TradingView) return

    const container = chartContainerRef.current
    container.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f5f7fa 0%, #fbfff1 100%); border-radius: 12px;">
        <p style="color: #7a8292; font-size: 14px;">TradingView Lightweight Chart Loading...</p>
      </div>
    `
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    setUploadError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setUploadError('Only image files are allowed')
          continue
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setUploadError('File too large. Max size is 5MB.')
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const { url } = await response.json()
        uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        const newScreenshots = [...screenshots, ...uploadedUrls]
        setScreenshots(newScreenshots)

        // Save to database
        await updateTradeScreenshots(newScreenshots)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const updateTradeScreenshots = async (urls: string[]) => {
    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshot_urls: urls }),
      })

      if (!response.ok) {
        throw new Error('Failed to update screenshots')
      }

      if (onUpdate) {
        onUpdate({ ...trade, screenshot_urls: urls })
      }
    } catch (error) {
      console.error('Failed to save screenshots:', error)
      setUploadError('Failed to save screenshots to database')
    }
  }

  const removeScreenshot = async (indexToRemove: number) => {
    const newScreenshots = screenshots.filter((_, idx) => idx !== indexToRemove)
    setScreenshots(newScreenshots)
    await updateTradeScreenshots(newScreenshots)
  }

  const duration = new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime()
  const durationHours = (duration / (1000 * 60 * 60)).toFixed(1)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-card border-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">{trade.symbol}</h2>
            <div className="flex items-center gap-2">
              {trade.direction === "long" ? (
                <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={cn(
                "font-semibold uppercase text-sm",
                trade.direction === "long"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {trade.direction === "long" ? "BUY" : "SELL"}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Chart Container */}
          <div ref={chartContainerRef} className="w-full h-96 rounded-lg border border-border" />

          {/* Trade Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Entry Price</p>
              <p className="text-xl font-bold text-foreground">{trade.entryPrice.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground mt-2">at {trade.entryTime}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Exit Price</p>
              <p className="text-xl font-bold text-foreground">{trade.exitPrice.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground mt-2">at {trade.exitTime}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Quantity</p>
              <p className="text-xl font-bold text-foreground">{trade.quantity}</p>
              <p className="text-xs text-muted-foreground mt-2">Lots</p>
            </div>

            <div className={cn(
              "p-4 rounded-lg",
              trade.pnl >= 0
                ? "bg-green-50 dark:bg-green-950/20"
                : "bg-red-50 dark:bg-red-950/20"
            )}>
              <p className={cn(
                "text-xs mb-1",
                trade.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                P&L
              </p>
              <p className={cn(
                "text-xl font-bold",
                trade.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                ${trade.pnl.toFixed(2)}
              </p>
              <p className={cn(
                "text-xs mt-2",
                trade.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Trade Screenshots Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Screenshots</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Screenshot
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {uploadError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{uploadError}</p>
            )}

            {screenshots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {screenshots.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-border">
                    <Image
                      src={url}
                      alt={`Trade screenshot ${idx + 1}`}
                      width={300}
                      height={200}
                      className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                    />
                    <button
                      onClick={() => removeScreenshot(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Remove screenshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click to upload trade screenshots
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>

          {/* Trade Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Price Difference</p>
              <p className="text-lg font-semibold text-foreground">
                {(trade.exitPrice - trade.entryPrice).toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {trade.pnl > 0 ? "Profit" : "Loss"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Trade Duration</p>
              <p className="text-lg font-semibold text-foreground">{durationHours} hours</p>
              <p className="text-xs text-muted-foreground mt-1">
                from entry to exit
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Risk/Reward Ratio</p>
              <p className="text-lg font-semibold text-foreground">
                1:{Math.abs(trade.pnlPercent / 2).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                potential return
              </p>
            </div>
          </div>

          {/* Notes Section */}
          {trade.notes && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{trade.notes}</p>
            </div>
          )}

          {/* Strategy Section */}
          {trade.strategy && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Strategy</h3>
              <p className="text-sm text-muted-foreground">{trade.strategy}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button className="flex-1" variant="default">
            Export Trade
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Extend Window type for TradingView
declare global {
  interface Window {
    TradingView?: any
  }
}
