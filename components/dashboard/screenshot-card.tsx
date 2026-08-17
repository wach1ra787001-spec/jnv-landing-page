'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Copy, FileImage } from 'lucide-react'

interface ScreenshotCardProps {
  tradeId: string
  onScreenshotAdd?: (file: File) => void
}

export function ScreenshotCard({ tradeId, onScreenshotAdd }: ScreenshotCardProps) {
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

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
    files.forEach(file => {
      onScreenshotAdd?.(file)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      onScreenshotAdd?.(file)
    })
  }

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4">Trade Screenshots</h3>
      
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border/50 bg-muted/30 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <FileImage className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Drop screenshots here or click to browse</p>
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
            <Button variant="outline" asChild className="cursor-pointer gap-2">
              <span>
                <Upload className="w-4 h-4" />
                Upload Screenshots
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Screenshots List */}
      {screenshots.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-foreground">{screenshots.length} screenshots added</p>
          <div className="grid grid-cols-2 gap-4">
            {screenshots.map((src, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-border/50">
                <img src={src} alt={`Trade screenshot ${idx + 1}`} className="w-full h-32 object-cover" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-1"
                  onClick={() => navigator.clipboard.writeText(src)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
