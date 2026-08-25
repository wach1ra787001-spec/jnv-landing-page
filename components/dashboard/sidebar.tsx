"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Settings,
  Calendar,
  History,
  TrendingDown,
  BarChart2,
  Target,
  BookMarked,
  StickyNote,
  ChevronDown,
  Wallet,
  User,
  Zap,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "./sidebar-context"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface DashboardSidebarProps {
  user: SupabaseUser
  profile: Profile | null
}

const personalAreaSubItems = [
  { href: "/dashboard/personal-area/goals", label: "Goals", icon: Target },
  { href: "/dashboard/personal-area/stats", label: "Personal Stats", icon: BarChart2 },
  { href: "/dashboard/personal-area/playbooks", label: "Playbooks", icon: BookMarked },
  { href: "/dashboard/personal-area/notes", label: "Notes", icon: StickyNote },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
]

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/journal", label: "Trade Journal", icon: BookOpen },
  { href: "/dashboard/monthly", label: "Monthly", icon: Calendar },
  { href: "/dashboard/trade-history", label: "Trade History", icon: History },
  { href: "/dashboard/templates", label: "Templates & Playbooks", icon: Zap },
  { href: "/dashboard/backtest", label: "Backtest", icon: TrendingDown },
  { href: "/dashboard/advanced-stats", label: "Advanced Statistics", icon: BarChart2 },
  { href: "/dashboard/coach", label: "AI Coach", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { isMobileOpen, setMobileOpen, isSidebarOpen, setSidebarOpen } = useSidebar()
  const [isDark, setIsDark] = useState(false)
  const hoverZoneRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPersonalAreaActive = pathname.startsWith("/dashboard/personal-area") || pathname.startsWith("/dashboard/accounts")
  const [personalAreaOpen, setPersonalAreaOpen] = useState(isPersonalAreaActive)

  // Detect dark mode
  useEffect(() => {
    const htmlElement = document.documentElement
    setIsDark(htmlElement.classList.contains("dark"))
    const observer = new MutationObserver(() => {
      setIsDark(htmlElement.classList.contains("dark"))
    })
    observer.observe(htmlElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isPersonalAreaActive) setPersonalAreaOpen(true)
  }, [isPersonalAreaActive])

  // Close on route change
  useEffect(() => {
    setMobileOpen(false)
    setSidebarOpen(false)
  }, [pathname, setMobileOpen, setSidebarOpen])

  const handleMouseEnterZone = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setSidebarOpen(true)
  }

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setSidebarOpen(false)
    }, 150)
  }

  const handleMouseEnterSidebar = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setSidebarOpen(true)
  }

  const toggleOpen = () => setSidebarOpen(!isSidebarOpen)

  const visible = isSidebarOpen || isMobileOpen

  return (
    <TooltipProvider delayDuration={0}>
      {/* Invisible hover trigger zone — always present on the left edge */}
      <div
        ref={hoverZoneRef}
        onMouseEnter={handleMouseEnterZone}
        onMouseLeave={handleMouseLeave}
        className="fixed top-0 left-0 h-full w-3 z-40 hidden md:block"
      />

      {/* Toggle button — always visible, no rounded corners */}
      <button
        onClick={toggleOpen}
        className="hidden md:flex fixed top-4 left-4 z-50 h-8 w-8 items-center justify-center bg-sidebar border border-border/60 shadow-sm hover:bg-sidebar-foreground/10 transition-colors duration-150"
        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        style={{ borderRadius: 0 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', lineHeight: 1 }}>menu</span>
      </button>

      {/* Sidebar panel — slides in/out as overlay */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnterSidebar}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "bg-sidebar flex flex-col fixed inset-y-0 left-0 z-40 w-60 overflow-hidden",
          "transform transition-transform duration-300 ease-in-out",
          // Desktop: controlled by isOpen state
          visible ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          boxShadow: visible ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
          borderRight: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
        }}
      >
        {/* Logo */}
        <div className="p-4 pt-[18px] border-b border-border/50 shrink-0">
          {/* Spacer so logo doesn't overlap the toggle button */}
          <Link href="/" className="flex items-center gap-2 ml-8">
            <Image
              src={isDark ? "/logo-jnv-dark.png" : "/logo-jnv.png"}
              alt="JnV Journal Logo"
              width={28}
              height={28}
              className="shrink-0 rounded-md"
            />
            <span className="text-base font-bold text-sidebar-foreground whitespace-nowrap">
              JnV Journal
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Personal Area */}
          <div>
            <button
              onClick={() => setPersonalAreaOpen(!personalAreaOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isPersonalAreaActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
              )}
            >
              <User className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1 text-left">Personal Area</span>
              <ChevronDown
                className={cn("w-4 h-4 transition-transform duration-200", personalAreaOpen && "rotate-180")}
              />
            </button>
            {personalAreaOpen && (
              <div className="ml-4 pl-3 border-l border-border/50 space-y-0.5">
                {personalAreaSubItems.map((sub) => {
                  const isSubActive = pathname === sub.href || pathname.startsWith(sub.href)
                  return <Link key={sub.href} href={sub.href} className={cn("flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150", isSubActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground")}><sub.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} /><span>{sub.label}</span></Link>
                })}
              </div>
            )}
          </div>

          {navItems.slice(4).map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <Link href="/dashboard/settings">
          <div className="p-4 border-t border-border/50 shrink-0 cursor-pointer hover:bg-sidebar-foreground/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-primary">
                  {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "Trader"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </Link>
      </aside>
    </TooltipProvider>
  )
}
