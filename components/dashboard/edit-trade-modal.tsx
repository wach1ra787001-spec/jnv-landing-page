"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Loader2, Save } from "lucide-react"
import { appToast } from "@/lib/toast-utils"

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

interface EditTradeModalProps {
  trade: Trade
  onClose: () => void
  onUpdate: (updatedTrade: Trade) => void
}

export function EditTradeModal({ trade, onClose, onUpdate }: EditTradeModalProps) {
  const [formData, setFormData] = useState({
    symbol: trade.symbol,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    quantity: trade.quantity,
    notes: trade.notes || "",
    strategy: trade.strategy || "",
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: formData.symbol,
          entry_price: parseFloat(formData.entryPrice.toString()),
          exit_price: parseFloat(formData.exitPrice.toString()),
          quantity: parseFloat(formData.quantity.toString()),
          strategy: formData.strategy,
        })
      })

      if (response.ok) {
        const updatedTrade = await response.json()
        onUpdate({
          ...trade,
          symbol: updatedTrade.symbol,
          entryPrice: updatedTrade.entry_price,
          exitPrice: updatedTrade.exit_price,
          quantity: updatedTrade.quantity,
          pnl: updatedTrade.pnl,
          pnlPercent: updatedTrade.pnl_percent,
          strategy: updatedTrade.strategy,
        })
      } else {
        appToast.tradeSaveFailed()
      }
    } catch (error) {
      appToast.tradeSaveFailed()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-card border-border p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Edit Trade</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Symbol</label>
            <Input
              type="text"
              value={formData.symbol}
              onChange={(e) => handleChange("symbol", e.target.value)}
              className="bg-input border-border"
              placeholder="e.g., EURUSD"
            />
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Entry Price</label>
            <Input
              type="number"
              step="0.00001"
              value={formData.entryPrice}
              onChange={(e) => handleChange("entryPrice", e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* Exit Price */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Exit Price</label>
            <Input
              type="number"
              step="0.00001"
              value={formData.exitPrice}
              onChange={(e) => handleChange("exitPrice", e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
            <Input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Strategy</label>
            <Input
              type="text"
              value={formData.strategy}
              onChange={(e) => handleChange("strategy", e.target.value)}
              className="bg-input border-border"
              placeholder="e.g., Breakout, Support/Resistance"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="w-full h-24 px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none"
              placeholder="Add any notes about this trade..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-border/50">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
