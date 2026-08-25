"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { calculateRiskPosition, getInstrumentRiskMetadata, type RiskDirection } from "@/lib/backtest/risk-calculator"
import { isEditable, type PositionState } from "@/lib/backtest/position-state"

export type { PositionState }

type Props = {
  symbol: string
  position: PositionState
  placementMode: RiskDirection | null
  onArmPlacement: (direction: RiskDirection) => void
  onCancelPlacement: () => void
  onUpdateLevel: (key: "entry" | "stopLoss" | "takeProfit", value: number) => void
  onSetDirection: (direction: RiskDirection) => void
  onPlaceTrade: (position: NonNullable<ReturnType<typeof calculateRiskPosition>["position"]>) => void
}

export function BacktestRiskPanel({ symbol, position, placementMode, onArmPlacement, onCancelPlacement, onUpdateLevel, onSetDirection, onPlaceTrade }: Props) {
  const [balance, setBalance] = useState("10000")
  const [riskPercent, setRiskPercent] = useState("1")
  const editable = isEditable(position)
  const metadata = useMemo(() => getInstrumentRiskMetadata(symbol), [symbol])

  const result = useMemo(() => {
    if (![position.entry, position.stopLoss, position.takeProfit].every((v) => Number.isFinite(v as number))) return {}
    return calculateRiskPosition(
      { direction: position.direction, entry: position.entry as number, stopLoss: position.stopLoss as number, takeProfit: position.takeProfit as number, balance: Number(balance), riskPercent: Number(riskPercent) },
      metadata,
    )
  }, [position, balance, riskPercent, metadata])

  const field = (label: string, key: "entry" | "stopLoss" | "takeProfit") => (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <Input
        value={position[key] ?? ""}
        step="any"
        type="number"
        disabled={!editable}
        onChange={(e) => {
          const num = Number(e.target.value)
          if (Number.isFinite(num)) onUpdateLevel(key, num)
        }}
        className="h-8 text-sm"
      />
    </label>
  )

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-card p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Risk Management</h2>
        <span className="text-xs font-mono text-muted-foreground">{symbol}</span>
      </div>

      {position.status === "idle" || position.status === "placing" ? (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground">Click the chart to place your entry, or choose a direction to start.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant={placementMode === "long" ? "default" : "outline"} onClick={() => onArmPlacement("long")}>
              {placementMode === "long" ? "Click chart…" : "Place Long"}
            </Button>
            <Button size="sm" variant={placementMode === "short" ? "default" : "outline"} onClick={() => onArmPlacement("short")}>
              {placementMode === "short" ? "Click chart…" : "Place Short"}
            </Button>
          </div>
          {placementMode && (
            <Button size="sm" variant="ghost" className="w-full" onClick={onCancelPlacement}>
              Cancel
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button size="sm" variant={position.direction === "long" ? "default" : "outline"} disabled={!editable} onClick={() => onSetDirection("long")}>
            Long
          </Button>
          <Button size="sm" variant={position.direction === "short" ? "default" : "outline"} disabled={!editable} onClick={() => onSetDirection("short")}>
            Short
          </Button>
        </div>
      )}

      {position.status !== "idle" && position.status !== "placing" && (
        <div className="space-y-3">
          {field("Entry price", "entry")}
          {field("Stop loss", "stopLoss")}
          {field("Take profit", "takeProfit")}
          <div className="border-t border-border pt-3 space-y-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Account balance</span>
              <Input value={balance} step="0.01" type="number" onChange={(e) => setBalance(e.target.value)} className="h-8 text-sm" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Risk per trade (%)</span>
              <Input value={riskPercent} step="0.01" type="number" onChange={(e) => setRiskPercent(e.target.value)} className="h-8 text-sm" />
            </label>
          </div>
        </div>
      )}

      {result.error && position.status !== "idle" && position.status !== "placing" && (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">{result.error}</p>
      )}

      {result.position && position.status === "pending" && (
        <div className="mt-4 space-y-2 rounded-md bg-muted/40 p-3 text-sm">
          <Metric label="Risk amount" value={`$${result.position.riskAmount.toFixed(2)}`} />
          <Metric label="Stop distance" value={result.position.stopDistance.toFixed(5)} />
          <Metric label="Risk / reward" value={`1:${result.position.riskReward.toFixed(2)}`} />
          <Metric label="Position size" value={result.position.positionSize.toFixed(4)} />
          <Metric label="Potential loss" value={`-$${result.position.potentialLoss.toFixed(2)}`} />
          <Metric label="Potential profit" value={`$${result.position.potentialProfit.toFixed(2)}`} />
          <Button className="w-full mt-2" onClick={() => onPlaceTrade(result.position!)}>
            Place trade
          </Button>
        </div>
      )}

      {position.status === "open" && (
        <p className="mt-4 rounded-md bg-primary/10 p-3 text-xs text-foreground">Trade is live. Drag SL/TP on the chart to adjust.</p>
      )}

      {position.status === "closed" && position.exit && (
        <div className="mt-4 space-y-2 rounded-md bg-muted/40 p-3 text-sm">
          <Metric label="Closed by" value={position.exit.reason === "TAKE_PROFIT" ? "Take profit" : "Stop loss"} />
          <Metric label="Exit price" value={String(position.exit.price)} />
        </div>
      )}
    </aside>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-foreground font-mono">{value}</strong>
    </div>
  )
}
