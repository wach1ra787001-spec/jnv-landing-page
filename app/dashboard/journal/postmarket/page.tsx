'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function PostmarketPage() {
  const router = useRouter(); const params = useSearchParams(); const tradeId = params.get('trade_id')
  return <div className="mx-auto max-w-3xl space-y-6"><Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2"><ArrowLeft className="size-4" />Back to trade</Button><Card className="border-border/60 bg-card p-6"><div className="flex items-start gap-3"><FileText className="mt-1 size-5 text-primary" /><div><h1 className="text-2xl font-bold text-foreground">Post-market routine</h1><p className="mt-1 text-sm text-muted-foreground">Review what happened after the session. The post-market routine form will be added here next.</p>{tradeId && <p className="mt-4 text-xs text-muted-foreground">This routine will be linked to trade {tradeId}.</p>}</div></div></Card></div>
}
