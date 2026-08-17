'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  Banknote,
  BrainCircuit,
  MonitorDot,
  BarChart3,
  Flag,
  ScrollText,
  HeartPulse,
  Settings,
  Megaphone,
  Headphones,
  ArrowLeft,
} from 'lucide-react'

const navSections = [
  {
    label: null,
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, superAdminOnly: true },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/admin/payments', label: 'Payments', icon: Banknote },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/ai', label: 'AI Monitoring', icon: BrainCircuit },
      { href: '/admin/mt5', label: 'MT5 Monitoring', icon: MonitorDot },
      { href: '/admin/support', label: 'Support', icon: Headphones },
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/feature-flags', label: 'Feature Flags', icon: Flag },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { href: '/admin/system-health', label: 'System Health', icon: HeartPulse },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

interface AdminSidebarProps {
  isSuperAdmin: boolean
}

export function AdminSidebar({ isSuperAdmin }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--sidebar)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">Admin Panel</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Journal
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                if (item.superAdminOnly && !isSuperAdmin) return null
                const Icon = item.icon
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
