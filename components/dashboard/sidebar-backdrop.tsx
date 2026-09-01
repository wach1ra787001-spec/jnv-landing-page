"use client"

import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"

export function SidebarBackdrop() {
  const { isMobileOpen, setMobileOpen } = useSidebar()

  return (
    <div
      className={cn(
        // Keep the drawer above the scrim so its menu remains interactive.
        "fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 md:hidden",
        isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      onClick={() => setMobileOpen(false)}
      aria-hidden="true"
    />
  )
}
