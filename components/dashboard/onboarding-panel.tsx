"use client"

import { useEffect, useState } from "react"
import { Check, ChevronRight, Loader2, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreatePlaybookForm } from "@/components/dashboard/create-playbook-form"

interface PlaybookFormData {
  name: string
  color: string
  label: string
  entryCriteria: Array<{ id: string; title: string; description: string }>
  exitCriteria: Array<{ id: string; title: string; description: string }>
  linkedRuleIds: string[]
}

interface OnboardingData {
  complete: boolean
  firstName: string
  preferredName: string
  accounts: Array<{ id: string; account_name: string; account_type: string }>
  playbooks: Array<{ id: string; title: string }>
}

const brokerMethods = [
  { label: "MetaTrader 5", href: "/dashboard/settings?tab=broker&method=mt5" },
  { label: "TradeLocker", href: "/dashboard/settings?tab=broker&method=tradelocker" },
  { label: "cTrader", href: "/api/ctrader/auth" },
]

export function OnboardingPanel() {
  const [data, setData] = useState<OnboardingData | null>(null)
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState("")
  const [preferredName, setPreferredName] = useState("")
  const [accountName, setAccountName] = useState("My Trading Account")
  const [playbookTitle, setPlaybookTitle] = useState("")
  const [showPlaybookForm, setShowPlaybookForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    const response = await fetch("/api/onboarding", { cache: "no-store" })
    if (!response.ok) return
    const next = await response.json()
    setData(next)
    setFirstName(next.firstName || "")
    setPreferredName(next.preferredName || "")
    if (next.accounts?.length) setStep(2)
    else if (next.firstName) setStep(1)
  }

  useEffect(() => { void load() }, [])
  if (!data || data.complete) return null

  const saveIdentity = async () => {
    setBusy(true); setError("")
    const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, preferredName }) })
    setBusy(false)
    if (!response.ok) { setError((await response.json()).error || "Enter your first name"); return }
    setStep(1)
  }

  const createAccount = async () => {
    setBusy(true); setError("")
    const response = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_name: accountName, account_type: "manual", currency: "USD", risk_percent: 1, risk_amount: 1 }) })
    setBusy(false)
    if (!response.ok) { setError((await response.json()).error || "Could not create account"); return }
    await load(); setStep(2)
  }

  const createPlaybook = async (formData?: PlaybookFormData) => {
    setBusy(true); setError("")
    const response = await fetch("/api/playbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData ? {
        title: formData.name,
        description: formData.label,
        rules: {
          entry: formData.entryCriteria,
          exit: formData.exitCriteria,
          linkedRuleIds: formData.linkedRuleIds,
        },
      } : {
        title: playbookTitle,
        description: "My trading strategy",
        rules: { entry: [], exit: [], linkedRuleIds: [] },
      }),
    })
    setBusy(false)
    if (!response.ok) { setError((await response.json()).error || "Could not create strategy"); return }
    await finish()
  }

  const finish = async () => {
    const response = await fetch("/api/onboarding", { method: "PUT" })
    if (!response.ok) { setError((await response.json()).error || "Finish the required steps"); return }
    window.location.reload()
  }

  const stepLabels = ["Your profile", "Trading account", "Your strategy"]
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-4 backdrop-blur-xl">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border/60 bg-card/85 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-border/50 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome to JnV</p><h2 className="text-xl font-semibold text-foreground">Set up your trading workspace</h2></div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[180px_1fr]">
          <div className="flex gap-2 md:flex-col">
            {stepLabels.map((label, index) => <div key={label} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${step === index ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}><span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">{step > index ? <Check className="h-4 w-4" /> : index + 1}</span><span className="hidden md:inline">{label}</span></div>)}
          </div>
          <div className="min-h-[250px]">
            {step === 0 && <div className="space-y-5"><div><h3 className="text-2xl font-semibold">Tell us what to call you</h3><p className="mt-1 text-sm text-muted-foreground">This helps personalize your journal.</p></div><div className="space-y-2"><Label htmlFor="first-name">First name</Label><Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Your first name" /></div><div className="space-y-2"><Label htmlFor="preferred-name">Preferred name <span className="text-muted-foreground">(optional)</span></Label><Input id="preferred-name" value={preferredName} onChange={(event) => setPreferredName(event.target.value)} placeholder="What should we call you?" /></div><Button onClick={saveIdentity} disabled={busy || !firstName.trim()} className="w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ChevronRight className="ml-2 h-4 w-4" /></>}</Button></div>}
            {step === 1 && <div className="space-y-5"><div><h3 className="text-2xl font-semibold">Choose your account path</h3><p className="mt-1 text-sm text-muted-foreground">Create an account for manual journaling or connect one of your broker methods.</p></div><div className="rounded-2xl border border-border/60 p-4"><Label htmlFor="account-name">Manual account name</Label><Input id="account-name" className="mt-2" value={accountName} onChange={(event) => setAccountName(event.target.value)} /><Button onClick={createAccount} disabled={busy || !accountName.trim()} className="mt-3 w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create manual account"}</Button></div><div className="grid gap-2 sm:grid-cols-3">{brokerMethods.map((method) => <a key={method.label} href={method.href} className="rounded-xl border border-border/60 px-3 py-3 text-center text-sm transition hover:border-primary hover:bg-primary/5">Connect {method.label}</a>)}</div><p className="text-xs text-muted-foreground">After connecting a broker, return here to continue.</p></div>}
            {step === 2 && <div className="space-y-5"><div><h3 className="text-2xl font-semibold">Choose your first playbook</h3><p className="mt-1 text-sm text-muted-foreground">Select an existing strategy or create one using the same playbook builder used in Personal Area.</p></div>{data.playbooks.length > 0 ? <div className="space-y-2"><p className="text-sm font-medium text-foreground">Your existing playbooks</p>{data.playbooks.map((playbook) => <button key={playbook.id} onClick={finish} disabled={busy} className="flex w-full items-center justify-between rounded-xl border border-border/60 p-3 text-left hover:border-primary hover:bg-primary/5"><span>{playbook.title}</span><ChevronRight className="h-4 w-4" /></button>)}</div> : <p className="rounded-xl border border-dashed border-border/60 p-3 text-sm text-muted-foreground">You do not have any playbooks yet.</p>} {!showPlaybookForm ? <><Button onClick={() => setShowPlaybookForm(true)} className="w-full">Create a new playbook</Button><a href="/dashboard/templates" className="block text-center text-sm text-primary underline-offset-4 hover:underline">Browse templates and playbooks</a></> : <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-border/60 bg-background/50 p-2"><CreatePlaybookForm onSubmit={createPlaybook} onCancel={() => setShowPlaybookForm(false)} /></div>}</div>}
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
