'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Lightbulb,
  Zap,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdvancedStatsMenuProps {
  userTier: 'free' | 'pro' | 'elite'
}

const statsMenus = [
  {
    id: 'time',
    label: 'Time Analysis',
    description: 'Best sessions, holding time, news timing, and month-over-month performance',
    icon: Calendar,
    href: '/dashboard/advanced-stats/time',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'reflection',
    label: 'Reflection Analysis',
    description: 'Journal impact, planning effectiveness, and pre-market preparation',
    icon: Lightbulb,
    href: '/dashboard/advanced-stats/reflection',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'streaks',
    label: 'Streaks & Discipline',
    description: 'Winning streaks, direction bias, discipline tracking, and recovery patterns',
    icon: Zap,
    href: '/dashboard/advanced-stats/streaks',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'models',
    label: 'Models & Setup',
    description: 'Strategy performance, setup analysis, win-loss distributions, and bias effects',
    icon: BarChart3,
    href: '/dashboard/advanced-stats/models',
    color: 'from-green-500 to-emerald-500',
  },
]

export function AdvancedStatsMenu({ userTier = 'free' }: AdvancedStatsMenuProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-semibold text-foreground">
            Advanced Statistics
          </h1>
          {userTier === 'elite' && (
            <span className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
              ELITE
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          Deep insights into your trading performance across time, discipline, patterns, and strategies
        </p>
      </div>

      {/* Stats Menu Cards - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsMenus.map((menu) => {
          const Icon = menu.icon
          return (
            <Card
              key={menu.id}
              className="p-6 border border-border/50 hover:border-border/100 transition-all cursor-pointer group hover:bg-muted/30 active:scale-98"
              onClick={() => router.push(menu.href)}
            >
              <div className="flex items-start justify-between mb-4">
                {/* Icon */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br text-white",
                  `bg-gradient-to-br ${menu.color}`
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>

              {/* Content */}
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  {menu.label}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {menu.description}
                </p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
