"use client"

import { useSidebar } from "./sidebar-context"

const SIDEBAR_WIDTH = 240 // w-60 = 240px

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen, isMobileOpen } = useSidebar()
  const pushed = isSidebarOpen && !isMobileOpen

  return (
    <div
      className="flex flex-col flex-1 min-w-0 overflow-hidden"
      style={{
        marginLeft: pushed ? `${SIDEBAR_WIDTH}px` : "0px",
        transition: "margin-left 300ms ease-in-out",
      }}
    >
      {children}
    </div>
  )
}
