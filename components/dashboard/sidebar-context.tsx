"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  toggleMobileOpen: () => void
  setMobileOpen: (open: boolean) => void
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize collapsed state from localStorage on desktop
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const stored = localStorage.getItem('jnvpro_sidebar_collapsed')
      if (stored !== null) {
        setIsCollapsed(stored === 'true')
      }
    }
  }, [])

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && mounted) {
      localStorage.setItem('jnvpro_sidebar_collapsed', String(isCollapsed))
    }
  }, [isCollapsed, mounted])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isMobileOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }
  }, [isMobileOpen])

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const setCollapsedState = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }, [])

  const toggleMobileOpen = useCallback(() => {
    setIsMobileOpen((prev) => !prev)
  }, [])

  const setMobileOpenState = useCallback((open: boolean) => {
    setIsMobileOpen(open)
  }, [])

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed: setCollapsedState, isMobileOpen, toggleMobileOpen, setMobileOpen: setMobileOpenState, isSidebarOpen, setSidebarOpen: setIsSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
