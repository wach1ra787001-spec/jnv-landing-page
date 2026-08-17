"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { ProfileTab } from "@/components/settings/profile-tab"

export default function ProfileSettingsPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      {/* Back Button */}
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and trading preferences
        </p>
      </div>

      {/* Content */}
      <Card className="border border-border/50 p-6">
        <ProfileTab />
      </Card>
    </div>
  )
}
