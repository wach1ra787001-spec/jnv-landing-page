"use client"

import { useEffect, useRef } from "react"
import { JnvMark } from "@/components/brand/jnv-mark"
import { cn } from "@/lib/utils"

interface TradeSaveSuccessProps {
  open: boolean
  onComplete: () => void
}

export function TradeSaveSuccess({ open, onComplete }: TradeSaveSuccessProps) {
  const completedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      completedRef.current = false
      return
    }

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 420 : 1500
    const timer = window.setTimeout(() => {
      if (completedRef.current) return
      completedRef.current = true
      onComplete()
    }, duration)

    return () => window.clearTimeout(timer)
  }, [open, onComplete])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 px-6"
      role="status"
      aria-live="polite"
      aria-label="Trade successfully recorded"
    >
      <div className="relative flex flex-col items-center gap-4 sm:gap-5 md:gap-6">
        <div className="trade-save-ripple absolute inset-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 sm:size-40 md:size-52 lg:size-64" />
        <div className="trade-save-glow absolute inset-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl sm:size-52 md:size-64 lg:size-80" />
        <div className="trade-save-logo relative flex size-24 items-center justify-center rounded-full bg-background sm:size-32 md:size-40 lg:size-48">
          <JnvMark className="size-20 sm:size-28 md:size-36 lg:size-44" title="JnV Trading Journal" />
        </div>
        <p className="trade-save-label text-xs font-medium tracking-wide text-foreground sm:text-sm md:text-base">Trade recorded</p>
      </div>
      <style jsx>{`
        .trade-save-logo { animation: trade-save-scale 520ms cubic-bezier(.22,1,.36,1) both; }
        .trade-save-logo svg { clip-path: inset(0 0 100% 0); animation: trade-save-draw 650ms 260ms cubic-bezier(.22,1,.36,1) forwards; }
        .trade-save-label { animation: trade-save-fade 360ms 700ms ease-out both; }
        .trade-save-ripple { animation: trade-save-ripple 1050ms 320ms ease-out both; }
        .trade-save-glow { animation: trade-save-glow 1050ms 250ms ease-out both; }
        @media (min-width: 768px) {
          .trade-save-logo { animation-duration: 600ms; }
          .trade-save-ripple { animation-duration: 1250ms; }
          .trade-save-glow { animation-duration: 1250ms; }
        }
        @media (min-width: 1280px) {
          .trade-save-logo { animation-duration: 680ms; }
          .trade-save-ripple { animation-duration: 1400ms; }
          .trade-save-glow { animation-duration: 1400ms; }
        }
        @keyframes trade-save-scale { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes trade-save-draw { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0); } }
        @keyframes trade-save-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes trade-save-ripple { from { opacity: .45; transform: translate(-50%, -50%) scale(.55); } to { opacity: 0; transform: translate(-50%, -50%) scale(1.7); } }
        @keyframes trade-save-glow { from { opacity: 0; transform: translate(-50%, -50%) scale(.7); } 35% { opacity: .8; } to { opacity: 0; transform: translate(-50%, -50%) scale(1.25); } }
        @media (prefers-reduced-motion: reduce) {
          .trade-save-logo, .trade-save-logo svg, .trade-save-label, .trade-save-ripple, .trade-save-glow { animation-duration: 1ms; animation-delay: 0ms; }
        }
      `}</style>
    </div>
  )
}
