'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ClipboardCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function PremarketTradeCard({ tradeId }: { tradeId: string }) {
  const [routine, setRoutine] = useState<Record<string, any> | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => { fetch(`/api/premarket?trade_id=${encodeURIComponent(tradeId)}`).then((response) => response.ok ? response.json() : null).then((data) => setRoutine(data?.routine || null)).catch(() => setRoutine(null)) }, [tradeId])
  if (!routine) return null
  const details = [['Trading date', routine.trading_date], ['Session', routine.session_name], ['Market bias', routine.market_bias], ['Higher-timeframe bias', routine.higher_timeframe_bias], ['Expected setups', routine.planned_setups], ['Planned instruments', routine.planned_instruments], ['Risk limits', routine.risk_limits], ['Entry criteria', routine.entry_criteria], ['Stop-loss criteria', routine.stop_loss_criteria], ['Take-profit criteria', routine.take_profit_criteria], ['Pre-market notes', routine.premarket_notes]]
  return <Card className="border-primary/20 bg-primary/5 p-5"><button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left"><span className="flex items-center gap-3"><ClipboardCheck className="size-5 text-primary" /><span><span className="block font-semibold text-foreground">See what you did premarket</span><span className="block text-sm text-muted-foreground">Review the plan you made before this trade.</span></span></span><ChevronDown className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="mt-5 grid gap-4 border-t border-primary/15 pt-5 sm:grid-cols-2">{details.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '').map(([label, value]) => <div key={label}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{String(value)}</p></div>)}</div>}</Card>
}
