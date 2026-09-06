"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileJson, FileText, FileImage, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const exportFormats = [
  {
    id: "json",
    name: "JSON Export",
    description: "Export all your data in JSON format for full data portability",
    icon: FileJson,
    fileType: ".json",
  },
  {
    id: "csv",
    name: "CSV Export",
    description: "Export trades and analytics in CSV format for spreadsheet analysis",
    icon: FileText,
    fileType: ".csv",
  },
  {
    id: "pdf",
    name: "PDF Report",
    description: "Generate a comprehensive PDF report of your trading performance",
    icon: FileImage,
    fileType: ".pdf",
  },
]

export function DataExportTab() {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isDurationDialogOpen, setIsDurationDialogOpen] = useState(false)
  const [duration, setDuration] = useState("30")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [durationError, setDurationError] = useState<string | null>(null)

  const handleExport = async () => {
    if (!selectedFormat) return

    if (duration === "custom" && (!customStart || !customEnd || customStart > customEnd)) {
      setDurationError("Choose a valid start and end date.")
      return
    }

    setDurationError(null)
    setIsDurationDialogOpen(false)
    setIsExporting(true)

    try {
      const today = new Date()
      const endDate = duration === "custom" ? customEnd : today.toISOString().slice(0, 10)
      const startDate = duration === "custom"
        ? customStart
        : duration === "all"
          ? "2000-01-01"
          : new Date(today.getTime() - Number(duration) * 86400000).toISOString().slice(0, 10)
      const response = await fetch(`/api/data-export?format=${encodeURIComponent(selectedFormat)}&start=${startDate}&end=${endDate}`)
      if (!response.ok) throw new Error("Unable to generate report")
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `jnv-report-${endDate}.${selectedFormat}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Data Export</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Download your trading data in your preferred format
        </p>
      </div>

      <div className="space-y-3">
        {exportFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => setSelectedFormat(format.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-all",
              selectedFormat === format.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-background hover:border-primary/50"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                selectedFormat === format.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              <format.icon className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">{format.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {format.fileType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{format.description}</p>
            </div>

            <Download
              className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                selectedFormat === format.id ? "text-primary" : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {selectedFormat
            ? `Ready to export as ${exportFormats.find((f) => f.id === selectedFormat)?.name}`
            : "Select an export format above"}
        </p>
        <Button onClick={() => setIsDurationDialogOpen(true)} disabled={!selectedFormat || isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate Export
            </>
          )}
        </Button>
      </div>

      <Dialog open={isDurationDialogOpen} onOpenChange={setIsDurationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose report duration</DialogTitle>
            <DialogDescription>Select the period to include in your report.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Duration
              <select
                value={duration}
                onChange={(event) => {
                  setDuration(event.target.value)
                  setDurationError(null)
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
                <option value="all">All available data</option>
                <option value="custom">Custom date range</option>
              </select>
            </label>
            {duration === "custom" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  Start date
                  <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  End date
                  <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
                </label>
              </div>
            )}
            {durationError && <p className="text-sm text-destructive" role="alert">{durationError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDurationDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleExport}>Generate Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">Export History</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">trades_export_2026-03-10.csv</span>
            <span className="text-xs text-muted-foreground">5 days ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">performance_report_2026-03.pdf</span>
            <span className="text-xs text-muted-foreground">2 weeks ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
