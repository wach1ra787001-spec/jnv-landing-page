"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User as UserIcon, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationMenu } from "@/components/dashboard/notification-menu"
import { AccountSelector } from "@/components/dashboard/account-selector"
import { useSidebar } from "./sidebar-context"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toggleMobileOpen } = useSidebar()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-6">
      {/* Mobile Hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden flex-shrink-0 h-9 w-9"
        onClick={toggleMobileOpen}
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Title Section - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex flex-1 flex-col ml-4">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Right Section - Action Items */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
        {/* Account Selector - Compact on mobile, normal on desktop */}
        <AccountSelector />
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <NotificationMenu />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9 md:w-auto md:px-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-xs md:text-sm font-medium text-accent-foreground">
                  {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <span className="hidden md:inline text-sm font-medium text-foreground ml-2">
                {profile?.full_name || "Trader"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-foreground">{profile?.full_name || "Trader"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-chart-2 focus:text-chart-2">
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
