'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heart, Share2, MessageCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicPlaybookPage({ params }: { params: Promise<{ slug: string }> }) {
  const [playbook, setPlaybook] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [slug, setSlug] = useState('')
  useEffect(() => { params.then(({ slug }) => setSlug(slug)) }, [params])
  useEffect(() => { if (slug) fetch(`/api/playbooks/public/${slug}`).then(r => r.ok ? r.json() : null).then(setPlaybook) }, [slug])

  if (!playbook) return <main className="min-h-screen bg-background p-8 text-muted-foreground">Loading playbook…</main>
  const engage = async (action: string, body = {}) => {
    const res = await fetch(`/api/playbooks/${playbook.id}/engagement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) })
    if (!res.ok) return toast.error('Sign in to engage with this playbook')
    if (action === 'like') { const result = await res.json(); setPlaybook((p: any) => ({ ...p, likes_count: result.likes_count })) }
    if (action === 'share') { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied') }
  }
  return <main className="min-h-screen bg-background p-6 md:p-12"><div className="mx-auto max-w-3xl space-y-6">
    <Card className="p-6 md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-primary">Community playbook</p><h1 className="mt-2 text-3xl font-bold text-foreground">{playbook.title}</h1><p className="mt-3 text-muted-foreground">{playbook.description}</p></div><Button variant="outline" size="icon" onClick={() => engage('share')} aria-label="Share playbook"><Share2 className="h-4 w-4" /></Button></div>
      <div className="mt-8 grid grid-cols-4 gap-3 border-y border-border py-5"><div><p className="text-xs text-muted-foreground">Win rate</p><p className="text-xl font-semibold text-foreground">{playbook.win_rate ?? 0}%</p></div><div><p className="text-xs text-muted-foreground">Trades taken</p><p className="text-xl font-semibold text-foreground">{playbook.trades_taken ?? 0}</p></div><div><p className="text-xs text-muted-foreground">P&L</p><p className="text-xl font-semibold text-foreground">${Number(playbook.pnl ?? 0).toFixed(2)}</p></div><div><p className="text-xs text-muted-foreground">Likes</p><p className="text-xl font-semibold text-foreground">{playbook.likes_count ?? 0}</p></div></div>
      <div className="mt-5 flex gap-2"><Button variant="outline" onClick={() => engage('like')}><Heart className="mr-2 h-4 w-4" />Like</Button><Button variant="outline" onClick={() => engage('share')}><Copy className="mr-2 h-4 w-4" />Copy link</Button></div>
    </Card>
    <Card className="p-6"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /><h2 className="font-semibold text-foreground">Comments</h2></div><div className="mt-4 flex gap-2"><Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your thoughts" /><Button onClick={async () => { await engage('comment', { content: comment }); setComment('') }}>Post</Button></div></Card>
  </div></main>
}
