"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/dashboard/sidebar-context"

const steps = [
  { target: "tour-log-trade", title: "Log a Trade", description: "Add a caught trade, a missed trade, or complete your premarket plan before you trade." },
  { target: "tour-personal-area", title: "Personal Area", description: "Open this menu to manage your accounts, goals, personal stats, playbooks, and Notes." },
  { target: "tour-playbooks", title: "Create a Playbook", description: "Document your strategy in a playbook, or start from a public template. We use it to measure your performance against your own rules." },
  { target: "tour-notes", title: "Your Notes", description: "Use Notes in Personal Area to capture reflections, reminders, and ideas that support your trading process." },
  { target: "tour-trade-history", title: "Trade History", description: "After logging trades, visit Trade History to review, filter, and inspect everything you have recorded." },
  { target: "tour-advanced-stats", title: "Advanced Statistics", description: "Explore deeper patterns in your trading, including streaks, consistency, recovery, and directional bias." },
  { target: "tour-ai-coach", title: "AI Coach", description: "Ask questions about your journal and get thoughtful coaching based on your trading data." },
  { target: "tour-settings", title: "Settings", description: "Manage your profile, broker connections, imports, subscription, appearance, data exports, and support." },
]

export function ProductTour({ initialOpen = false }: { initialOpen?: boolean }) {
  const { setSidebarOpen, setMobileOpen } = useSidebar()
  const [open, setOpen] = useState(initialOpen)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[index]

  const updateTarget = () => {
    const element = document.querySelector(`[data-tour="${step.target}"]`)
    setRect(element?.getBoundingClientRect() ?? null)
  }

  useEffect(() => {
    const restart = () => { setIndex(0); setOpen(true) }
    window.addEventListener("jnv:restart-product-tour", restart)
    return () => window.removeEventListener("jnv:restart-product-tour", restart)
  }, [])

  useEffect(() => {
    if (!open) return
    setSidebarOpen(true)
    setMobileOpen(true)
    if (step.target === "tour-playbooks" || step.target === "tour-notes") {
      const personalArea = document.querySelector('[data-tour="tour-personal-area"]') as HTMLButtonElement | null
      personalArea?.click()
    }

    const frame = requestAnimationFrame(() => {
      const element = document.querySelector(`[data-tour="${step.target}"]`)
      element?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" })
      requestAnimationFrame(updateTarget)
    })
    window.addEventListener("resize", updateTarget)
    window.addEventListener("scroll", updateTarget, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", updateTarget)
      window.removeEventListener("scroll", updateTarget, true)
    }
  }, [open, index, setMobileOpen, setSidebarOpen, step.target])

  const close = async (completed: boolean) => {
    setOpen(false)
    setSidebarOpen(false)
    setMobileOpen(false)
    await fetch("/api/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tourCompleted: completed }) })
  }

  const tooltipStyle = useMemo(() => {
    if (!rect) return undefined
    const cardWidth = Math.min(384, window.innerWidth - 32)
    const cardHeight = 250
    const gap = 16
    const left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - cardWidth - 16))
    const hasRoomBelow = rect.bottom + gap + cardHeight <= window.innerHeight
    const top = hasRoomBelow
      ? rect.bottom + gap
      : Math.max(16, rect.top - cardHeight - gap)
    return { left, top, width: cardWidth }
  }, [rect])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/65" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {rect && <div className="pointer-events-none fixed rounded-md border-2 border-primary bg-transparent shadow-[0_0_0_9999px_rgba(2,6,23,0.65)]" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />}
      <div className="fixed w-[calc(100vw-32px)] max-w-sm rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl" style={tooltipStyle}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">JnV quick tour · {index + 1}/{steps.length}</p><h2 id="tour-title" className="mt-1 text-lg font-semibold">{step.title}</h2></div>
          <button type="button" onClick={() => void close(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Skip tutorial"><X className="size-4" /></button>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => void close(false)}>Skip tutorial</Button>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}><ChevronLeft className="size-4" data-icon="inline-start" />Back</Button><Button size="sm" onClick={() => index === steps.length - 1 ? void close(true) : setIndex((value) => value + 1)}>{index === steps.length - 1 ? "Finish" : "Next"}<ChevronRight className="size-4" data-icon="inline-end" /></Button></div>
        </div>
      </div>
    </div>
  )
}

export const productTourSteps = steps

export function ProductTourButton() {
  return null
}

export function restartProductTour() {
  window.dispatchEvent(new Event("jnv:restart-product-tour"))
}
