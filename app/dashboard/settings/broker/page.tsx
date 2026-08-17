"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { BrokerTab } from "@/components/settings/broker-tab"
import { MT5ConnectionModal } from "@/components/dashboard/mt5-connection-modal"

interface MT5Credentials {
  accountNumber: string
  serverName: string
  investorPassword: string
}

export default function BrokerSettingsPage() {
  const router = useRouter()
  const [showMT5Modal, setShowMT5Modal] = useState(false)

  const handleMT5Connect = async (credentials: MT5Credentials) => {
    const response = await fetch('/api/mt5/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to connect MT5 account')
    }

    return response.json()
  }

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
          Broker & Import
        </h1>
        <p className="text-muted-foreground">
          Connect your trading accounts and import historical data
        </p>
      </div>

      <Card className="border border-border/50 p-6">
        <BrokerTab onConnectMT5={() => setShowMT5Modal(true)} />
      </Card>

      <MT5ConnectionModal
        isOpen={showMT5Modal}
        onClose={() => setShowMT5Modal(false)}
        onConnect={handleMT5Connect}
      />
    </div>
  )
}
