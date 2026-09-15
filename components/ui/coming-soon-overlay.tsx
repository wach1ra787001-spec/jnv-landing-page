"use client"

import { LockKeyhole } from "lucide-react"

interface ComingSoonOverlayProps {
  className?: string
  label?: string
}

export function ComingSoonOverlay({ className = "", label = "Coming soon" }: ComingSoonOverlayProps) {
  return (
    <div
      className={`pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-background/35 p-4 backdrop-blur-[3px] ${className}`}
      aria-label={label}
    >
      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-md">
        <LockKeyhole className="size-4 text-primary" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  )
}
