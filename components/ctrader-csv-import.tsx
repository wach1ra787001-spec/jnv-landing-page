'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Upload, Loader2 } from 'lucide-react'

export default function CTraderCSVImport() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [fileName, setFileName] = useState<string>('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setStatus('loading')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/ctrader/import-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setResult(data)
      } else {
        setStatus('error')
        setResult(data)
      }
    } catch (err: any) {
      setStatus('error')
      setResult({ error: err.message })
    }
  }

  return (
    <Card className="p-6 bg-card border border-border/50">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground mb-1">Import Trades from cTrader CSV</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Export your cTrader history: Desktop app → History tab → Right click → Export to CSV
          </p>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleUpload}
              disabled={status === 'loading'}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer block">
              {status === 'loading' ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Importing...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Click to upload CSV</p>
                    <p className="text-xs text-muted-foreground">or drag and drop</p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {status === 'success' && result && (
            <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Import Successful</h4>
                  <p className="text-sm text-green-800 mt-1">
                    Imported <strong>{result.imported}</strong> trades from {fileName}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-xs text-green-700 mt-1">
                      ({result.skipped} rows skipped due to errors)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'error' && result && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Import Failed</h4>
                  <p className="text-sm text-red-800 mt-1">{result.error}</p>
                  {result.details && result.details.length > 0 && (
                    <div className="text-xs text-red-700 mt-2 space-y-1">
                      {result.details.map((detail: string, i: number) => (
                        <p key={i}>• {detail}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
