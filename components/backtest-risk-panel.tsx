'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { calculateRiskPosition, getInstrumentRiskMetadata, type RiskDirection } from '@/lib/backtest/risk-calculator'

export type RiskPanelValues = { direction: RiskDirection; entry: string; stopLoss: string; takeProfit: string; balance: string; riskPercent: string }

type Props = { symbol: string; values: RiskPanelValues; onChange: (values: RiskPanelValues) => void; onPlaceTrade: (position: NonNullable<ReturnType<typeof calculateRiskPosition>['position']>) => void }

export function BacktestRiskPanel({ symbol, values, onChange, onPlaceTrade }: Props) {
  const result = useMemo(() => calculateRiskPosition({ direction: values.direction, entry: Number(values.entry), stopLoss: Number(values.stopLoss), takeProfit: Number(values.takeProfit), balance: Number(values.balance), riskPercent: Number(values.riskPercent) }, getInstrumentRiskMetadata(symbol)), [symbol, values])
  const set = (key: keyof RiskPanelValues, value: string) => onChange({ ...values, [key]: value })
  const field = (label: string, key: keyof RiskPanelValues, step = 'any') => <label className="space-y-1 text-xs text-muted-foreground"><span>{label}</span><Input value={values[key]} step={step} type="number" onChange={e => set(key, e.target.value)} className="h-8 text-sm" /></label>
  return <aside className="w-72 shrink-0 border-l border-border bg-card p-4 overflow-y-auto">
    <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-foreground">Risk Management</h2><span className="text-xs font-mono text-muted-foreground">{symbol}</span></div>
    <div className="grid grid-cols-2 gap-2 mb-4"><Button size="sm" variant={values.direction === 'long' ? 'default' : 'outline'} onClick={() => set('direction', 'long')}>Long</Button><Button size="sm" variant={values.direction === 'short' ? 'default' : 'outline'} onClick={() => set('direction', 'short')}>Short</Button></div>
    <div className="space-y-3">{field('Entry price', 'entry')}{field('Stop loss', 'stopLoss')}{field('Take profit', 'takeProfit')}<div className="border-t border-border pt-3 space-y-3">{field('Account balance', 'balance', '0.01')}{field('Risk per trade (%)', 'riskPercent', '0.01')}</div></div>
    {result.error ? <p className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">{result.error}</p> : result.position && <div className="mt-4 space-y-2 rounded-md bg-muted/40 p-3 text-sm"><Metric label="Risk amount" value={`$${result.position.riskAmount.toFixed(2)}`} /><Metric label="Stop distance" value={result.position.stopDistance.toFixed(5)} /><Metric label="Risk / reward" value={`1:${result.position.riskReward.toFixed(2)}`} /><Metric label="Position size" value={result.position.positionSize.toFixed(4)} /><Metric label="Potential profit" value={`$${result.position.potentialProfit.toFixed(2)}`} /><Button className="w-full mt-2" onClick={() => onPlaceTrade(result.position!)}>Place trade</Button></div>}
  </aside>
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{label}</span><strong className="text-foreground font-mono">{value}</strong></div> }
