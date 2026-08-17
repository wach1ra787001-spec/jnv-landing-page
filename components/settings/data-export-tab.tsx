"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

  const handleExport = async () => {
    if (!selectedFormat) return
    
    setIsExporting(true)
    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsExporting(false)
    console.log("Exporting in format:", selectedFormat)
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
        <Button onClick={handleExport} disabled={!selectedFormat || isExporting}>
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
