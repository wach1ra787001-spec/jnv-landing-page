"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import {
  User,
  Lock,
  Palette,
  CreditCard,
  Download,
  Database,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"

const settingsMenus = [
  {
    id: "profile",
    label: "Profile",
    description: "Manage your personal information and trading account details",
    icon: User,
    href: "/dashboard/settings/profile",
  },
  {
    id: "broker",
    label: "Broker & Import",
    description: "Connect your trading accounts and import historical data",
    icon: Database,
    href: "/dashboard/settings/broker",
  },
  {
    id: "security",
    label: "Security",
    description: "Update password and manage active sessions",
    icon: Lock,
    href: "/dashboard/settings/security",
  },
  {
    id: "subscription",
    label: "Subscription",
    description: "View your current plan and upgrade options",
    icon: CreditCard,
    href: "/dashboard/settings/subscription",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Customize theme and display preferences",
    icon: Palette,
    href: "/dashboard/settings/appearance",
  },
  {
    id: "data-export",
    label: "Data Export",
    description: "Export your trading data in various formats",
    icon: Download,
    href: "/dashboard/settings/data-export",
  },
]

export function SettingsClient({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col gap-3">
        {settingsMenus.map((menu) => {
          const Icon = menu.icon
          return (
            <Card
              key={menu.id}
              className="p-4 border border-border/50 hover:border-border/100 transition-all cursor-pointer group hover:bg-muted/30"
              onClick={() => router.push(menu.href)}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base">{menu.label}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{menu.description}</p>
                </div>
                <div className="flex-shrink-0 mt-1">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Card>
          )
        })}

        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full text-left p-4 border border-primary/30 hover:border-primary/60 rounded-lg transition-all cursor-pointer group hover:bg-primary/5"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-base">Admin Dashboard</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Admin</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  Manage users, subscriptions, AI usage, and platform settings
                </p>
              </div>
              <div className="flex-shrink-0 mt-1">
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
