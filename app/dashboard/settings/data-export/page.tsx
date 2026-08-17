"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { DataExportTab } from "@/components/settings/data-export-tab"

export default function DataExportSettingsPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Data Export
        </h1>
        <p className="text-muted-foreground">
          Export your trading data in various formats
        </p>
      </div>

      <Card className="border border-border/50 p-6">
        <DataExportTab />
      </Card>
    </div>
  )
}
