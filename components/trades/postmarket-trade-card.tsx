'use client'

import Link from 'next/link'
import { FileCheck2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function PostmarketTradeCard({ tradeId }: { tradeId: string }) {
  return <Card className="border-border/50 bg-card p-5"><div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 size-5 text-primary" /><div className="min-w-0 flex-1"><p className="font-semibold text-foreground">Post-market routine</p><p className="mt-1 text-sm text-muted-foreground">Record what happened, whether you followed the plan, and what to improve tomorrow.</p><Link href={`/dashboard/journal/postmarket?trade_id=${encodeURIComponent(tradeId)}`} className="mt-4 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add post-market routine</Link></div></div></Card>
}
