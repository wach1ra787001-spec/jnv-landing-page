'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccount } from '@/components/dashboard/account-context'
import { appToast } from '@/lib/toast-utils'

export default function MissedTradePage() {
  const router = useRouter()
  const { selectedAccountId } = useAccount()
  const [form, setForm] = useState({ symbol: '', time_of_day: '', anticipated_rr: '', timeframe: '', strategy: '', premarket_notes: '' })
  const [saving, setSaving] = useState(false)
  const [playbooks, setPlaybooks] = useState<Array<{ id: string; title: string }>>([])
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(true)
  useEffect(() => {
    fetch('/api/playbooks')
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setPlaybooks(Array.isArray(data) ? data : []))
      .catch(() => setPlaybooks([]))
      .finally(() => setLoadingPlaybooks(false))
  }, [])
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/missed-trades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, account_id: selectedAccountId }) })
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Unable to save missed trade')
      appToast.tradeSaved(form.symbol.toUpperCase(), '0', '0', true)
      router.push('/dashboard/trade-history')
    } catch (error) {
      appToast.tradeSaveFailed(error instanceof Error ? error.message : 'Unable to save missed trade')
    } finally { setSaving(false) }
  }
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back"><ArrowLeft className="size-4" /></Button><div><h1 className="text-2xl font-bold text-foreground">Journal a Missed Trade</h1><p className="text-sm text-muted-foreground">Capture the setup you anticipated but did not take.</p></div></div>
      <Card className="border border-border/50 bg-card p-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">Symbol<Input required value={form.symbol} onChange={(e) => update('symbol', e.target.value)} placeholder="EURUSD" /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Time of day<Input required value={form.time_of_day} onChange={(e) => update('time_of_day', e.target.value)} placeholder="London open" /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Anticipated RR<Input required type="number" min="0" step="0.01" value={form.anticipated_rr} onChange={(e) => update('anticipated_rr', e.target.value)} placeholder="2.5" /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Time frame<Input required value={form.timeframe} onChange={(e) => update('timeframe', e.target.value)} placeholder="15m" /></label>
            <div className="flex flex-col gap-2 text-sm font-medium sm:col-span-2"><Label htmlFor="missed-strategy">Strategy</Label><select id="missed-strategy" required value={form.strategy} onChange={(e) => update('strategy', e.target.value)} disabled={loadingPlaybooks} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="">{loadingPlaybooks ? 'Loading playbooks...' : 'Select a strategy or playbook'}</option>{playbooks.map((playbook) => <option key={playbook.id} value={playbook.title}>{playbook.title}</option>)}</select>{playbooks.length === 0 && !loadingPlaybooks && <p className="text-xs font-normal text-muted-foreground">Create a playbook in Personal Area to select it here.</p>}</div>
            <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">What did you do premarket?<textarea required value={form.premarket_notes} onChange={(e) => update('premarket_notes', e.target.value)} rows={6} placeholder="Describe your premarket preparation and what you anticipated..." className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></label>
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={saving || !selectedAccountId}>{saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : 'Save Missed Trade'}</Button></div>
        </form>
      </Card>
    </div>
  )
}
