'use client'

import Link from 'next/link'
import { ClipboardCheck, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function TradeRoutineLinks({ tradeId }: { tradeId: string }) {
  return <Card className="border-border/50 bg-card p-4"><p className="text-sm font-semibold text-foreground">Trading routines</p><p className="mt-1 text-sm text-muted-foreground">Add context before and after this trade.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href={`/dashboard/journal/premarket?trade_id=${encodeURIComponent(tradeId)}`} className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"><ClipboardCheck className="size-4 text-primary" />Add pre-market routine</Link><Link href={`/dashboard/journal/postmarket?trade_id=${encodeURIComponent(tradeId)}`} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"><FileText className="size-4 text-muted-foreground" />Add post-market routine</Link></div></Card>
}
