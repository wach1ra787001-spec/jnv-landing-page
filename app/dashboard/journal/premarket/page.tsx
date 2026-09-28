'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { appToast } from '@/lib/toast-utils'

const fields = [
  ['mindset', 'Mindset', 'How are you feeling before the session?'],
  ['market_bias', 'Market bias', 'What is your directional view and why?'],
  ['planned_setups', 'Planned setups', 'Which setups will you consider?'],
  ['risk_limits', 'Risk limits', 'What is your maximum risk and daily loss limit?'],
  ['trading_rules', 'Trading rules', 'Which rules must you follow today?'],
] as const

export default function PremarketPage() {
  const router = useRouter()
  const [session, setSession] = useState('london')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ mindset: '', market_bias: '', planned_setups: '', risk_limits: '', trading_rules: '' })
  const today = new Date().toISOString().slice(0, 10)
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true)
    try {
      const response = await fetch('/api/premarket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, session_name: session, routine_date: today }) })
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Unable to save routine')
      appToast.tradeSaved('Pre-market routine', '0', '0', true); router.push('/dashboard')
    } catch (error) { appToast.tradeSaveFailed(error instanceof Error ? error.message : 'Unable to save routine') } finally { setSaving(false) }
  }
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back"><ArrowLeft className="size-4" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Before the market</p><h1 className="text-2xl font-bold text-foreground">Log your pre-market routine</h1><p className="text-sm text-muted-foreground">Create a clear reference point before your session begins.</p></div></div>
    <Card className="border-border/60 bg-card p-5 sm:p-7"><form onSubmit={submit} className="flex flex-col gap-5"><div className="grid gap-5 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-medium">Session<select value={session} onChange={(event) => setSession(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="asian">Asian — 23:00 UTC</option><option value="london">London — 07:00 UTC</option><option value="new_york">New York — 13:00 UTC</option></select></label><label className="flex flex-col gap-2 text-sm font-medium">Date<Input type="date" value={today} readOnly /></label></div>{fields.map(([key, label, placeholder]) => <label key={key} className="flex flex-col gap-2 text-sm font-medium">{label}<textarea required value={form[key]} onChange={(event) => update(key, event.target.value)} rows={3} placeholder={placeholder} className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></label>)}<div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />Your routine is a private record to help you compare your plan with what happened in the market.</div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : 'Save pre-market routine'}</Button></div></form></Card>
  </div>
}
