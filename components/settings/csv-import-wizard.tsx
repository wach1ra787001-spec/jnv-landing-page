'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle, CheckCircle2, ChevronDown, FileUp, Loader2,
  Upload, X, ArrowRight, BookOpen,
} from 'lucide-react'
import {
  parseCSV, autoMapColumns, FIELD_MAP, REQUIRED_FIELDS,
  type ColumnMapping, type FieldKey, type ParseResult,
} from '@/lib/csv-import/parser'
import { appToast } from '@/lib/toast-utils'

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done'

const FIELD_LABELS: Record<FieldKey, string> = {
  symbol:       'Symbol',
  direction:    'Direction (Buy/Sell)',
  open_time:    'Open Time',
  close_time:   'Close Time',
  entry_price:  'Entry Price',
  exit_price:   'Exit Price',
  lot_size:     'Volume / Lots',
  pnl:          'Profit',
  commission:   'Commission',
  swap:         'Swap',
  stop_loss:    'Stop Loss',
  take_profit:  'Take Profit',
  external_ref: 'Trade ID / Reference',
  net_pnl:      'Net P&L',
}

export function CSVImportWizard() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping[]>([])
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; duplicates: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // ── Upload / parse ──────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      appToast.error('Invalid file type', 'Please upload a .csv file')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseCSV(text)
      setParseResult(result)
      setMapping(result.mapping)
      setStep('map')
    }
    reader.readAsText(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  // ── Column mapping ──────────────────────────────────────────────────────────

  const updateMapping = (csvHeader: string, fieldKey: FieldKey | null) => {
    setMapping(prev =>
      prev.map(m => m.csvHeader === csvHeader ? { ...m, fieldKey } : m)
    )
  }

  const missingRequired = REQUIRED_FIELDS.filter(
    f => !mapping.some(m => m.fieldKey === f)
  )

  // ── Preview / re-parse ──────────────────────────────────────────────────────

  const goToPreview = () => {
    if (!parseResult) return
    const rawText = parseResult.rawRows.length > 0
      ? [parseResult.headers.join(','), ...parseResult.rawRows.map(r =>
          parseResult.headers.map(h => r[h] ?? '').join(',')
        )].join('\n')
      : ''
    // Re-parse with user mapping applied
    const reparse = parseCSV(
      [parseResult.headers.join(','), ...parseResult.rawRows.map(r =>
        parseResult.headers.map(h => `"${(r[h] ?? '').replace(/"/g, '')}"`).join(',')
      )].join('\n'),
      mapping
    )
    setParseResult(reparse)
    setStep('preview')
  }

  // ── Confirm import ──────────────────────────────────────────────────────────

  const confirmImport = async () => {
    if (!parseResult) return
    setStep('importing')
    setImportError(null)

    try {
      const res = await fetch('/api/trades/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: parseResult.trades }),
      })
      const data = await res.json()

      if (!res.ok) {
        setImportError(data.error || 'Import failed')
        setStep('preview')
        return
      }

      setImportResult(data)
      setStep('done')

      // Fire "Journal Now" toast notification
      if (data.imported > 0) {
        appToast.tradeImported(
          `${data.imported} trade${data.imported > 1 ? 's' : ''}`,
          '',
          () => router.push('/dashboard/trade-journal')
        )
      }
    } catch (err: any) {
      setImportError(err.message)
      setStep('preview')
    }
  }

  const reset = () => {
    setStep('upload')
    setParseResult(null)
    setMapping([])
    setFileName('')
    setImportResult(null)
    setImportError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {(['upload', 'map', 'preview', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border
              ${step === s ? 'bg-primary text-primary-foreground border-primary' :
                ['upload','map','preview','done'].indexOf(step) > i ? 'bg-green-600 text-white border-green-600' :
                'border-border text-muted-foreground'}`}>
              {['upload','map','preview','done'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={step === s ? 'text-foreground font-medium' : ''}>
              {s === 'upload' ? 'Upload' : s === 'map' ? 'Map Columns' : s === 'preview' ? 'Preview' : 'Done'}
            </span>
            {i < 3 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* ── STEP: Upload ── */}
      {step === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
            ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">Upload a new file</p>
          <p className="text-sm text-muted-foreground mt-1">Drag & drop your CSV here, or click to browse</p>
          <p className="text-xs text-muted-foreground mt-3">Supports cTrader, MetaTrader 4/5, TradingView, Interactive Brokers, and generic CSVs</p>
        </div>
      )}

      {/* ── STEP: Map Columns ── */}
      {step === 'map' && parseResult && (
        <div className="space-y-4">
          {/* Detected broker */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">File: <span className="text-foreground font-medium">{fileName}</span></p>
              {parseResult.broker ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Detected: {parseResult.broker}
                </Badge>
              ) : (
                <Badge variant="outline">Broker not auto-detected</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="w-4 h-4 mr-1" /> Change file
            </Button>
          </div>

          {/* Column mapping table */}
          <Card className="border border-border/50">
            <div className="p-4 border-b border-border/50">
              <h4 className="font-semibold text-sm text-foreground">Map CSV columns to fields</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auto-mapped where possible. Fix any unrecognized columns before continuing.
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {mapping.map((m) => {
                const isRequired = m.fieldKey && REQUIRED_FIELDS.includes(m.fieldKey as FieldKey)
                const isMissed = !m.fieldKey
                return (
                  <div key={m.csvHeader} className="flex items-center gap-4 px-4 py-2.5">
                    <div className="w-48 shrink-0">
                      <span className={`text-sm font-mono ${isMissed ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {m.csvHeader}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-sm">→</div>
                    <div className="flex-1">
                      <select
                        value={m.fieldKey ?? ''}
                        onChange={(e) => updateMapping(m.csvHeader, (e.target.value as FieldKey) || null)}
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Ignore this column --</option>
                        {(Object.keys(FIELD_MAP) as FieldKey[]).map(f => (
                          <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                        ))}
                      </select>
                    </div>
                    {m.fieldKey && (
                      <Badge variant={REQUIRED_FIELDS.includes(m.fieldKey as FieldKey) ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                        {REQUIRED_FIELDS.includes(m.fieldKey as FieldKey) ? 'Required' : 'Optional'}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Missing required fields warning */}
          {missingRequired.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-700 dark:text-amber-400">
                Required fields not mapped: <strong>{missingRequired.map(f => FIELD_LABELS[f]).join(', ')}</strong>
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={goToPreview} disabled={missingRequired.length > 0}>
              Preview Trades <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP: Preview ── */}
      {step === 'preview' && parseResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{parseResult.trades.length}</span> trades ready to import
                {parseResult.skipped > 0 && <span className="text-amber-500 ml-2">({parseResult.skipped} rows skipped)</span>}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('map')}>
              Back to mapping
            </Button>
          </div>

          {/* Errors/skipped rows */}
          {parseResult.errors.length > 0 && (
            <Card className="border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {parseResult.errors.length} rows were skipped
                </p>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {parseResult.errors.slice(0, 8).map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">Row {e.row}: {e.message}</p>
                ))}
                {parseResult.errors.length > 8 && (
                  <p className="text-xs text-muted-foreground">...and {parseResult.errors.length - 8} more</p>
                )}
              </div>
            </Card>
          )}

          {/* Import error */}
          {importError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span className="text-destructive">{importError}</span>
            </div>
          )}

          {/* Trade preview table */}
          <Card className="border border-border/50 overflow-hidden">
            <div className="p-3 border-b border-border/50 text-xs text-muted-foreground">
              Showing first {Math.min(parseResult.trades.length, 20)} of {parseResult.trades.length} trades
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Symbol</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Dir</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Entry</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Exit</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Lots</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">P&L</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Open Time</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.trades.slice(0, 20).map((t, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono font-medium">{t.symbol}</td>
                      <td className="px-3 py-1.5">
                        <Badge variant={t.direction === 'long' ? 'default' : 'secondary'} className="text-[10px] px-1.5">
                          {t.direction === 'long' ? 'Long' : 'Short'}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 font-mono">{t.entry_price}</td>
                      <td className="px-3 py-1.5 font-mono">{t.exit_price ?? '—'}</td>
                      <td className="px-3 py-1.5">{t.lot_size}</td>
                      <td className={`px-3 py-1.5 font-mono font-medium ${t.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {t.open_time ? new Date(t.open_time).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          t.status === 'closed' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={confirmImport} disabled={parseResult.trades.length === 0}>
              Import {parseResult.trades.length} Trades
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP: Importing ── */}
      {step === 'importing' && (
        <div className="py-16 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-medium text-foreground">Importing trades...</p>
          <p className="text-sm text-muted-foreground">Checking for duplicates and saving to your account</p>
        </div>
      )}

      {/* ── STEP: Done ── */}
      {step === 'done' && importResult && (
        <div className="py-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Import Complete</h3>
            <p className="text-muted-foreground mt-1">
              <span className="text-foreground font-semibold">{importResult.imported}</span> trades imported
              {importResult.duplicates > 0 && <span className="text-muted-foreground">, {importResult.duplicates} duplicates skipped</span>}
              {importResult.skipped > 0 && <span className="text-muted-foreground">, {importResult.skipped} rows had errors</span>}
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={reset}>
              Import Another File
            </Button>
            <Button onClick={() => router.push('/dashboard/trade-journal')} className="gap-2">
              <BookOpen className="w-4 h-4" />
              Journal Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
