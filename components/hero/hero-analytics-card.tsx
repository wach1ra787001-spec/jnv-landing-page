'use client'

import { heroPreviewData } from '@/lib/mock/hero-preview'
import { TrendingUp, AlertCircle, Activity } from 'lucide-react'

export function HeroAnalyticsCard() {
  const { analytics } = heroPreviewData

  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header - Description only */}
      <div className="mb-3">
        <p className="text-xs text-slate-400">{analytics.description}</p>
      </div>

      {/* Stats Row */}
      <div className="space-y-2 mb-4">
        {analytics.stats.map((stat) => (
          <div key={stat.label} className="flex justify-between items-center">
            <span className="text-xs text-slate-400">{stat.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{stat.value}</span>
              <span className={`text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-slate-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white mb-3">{analytics.title}</h3>
        <p className="text-xs font-medium text-slate-300 mb-2">Recent Activity</p>
        {analytics.recentActivity.map((activity, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="text-slate-400">{activity.time} - {activity.event}</span>
            <span className="text-green-400 font-medium">{activity.pnl}</span>
          </div>
        ))}
      </div>

      {/* Live Badge */}
      <div className="mt-auto pt-3 border-t border-slate-700">
        <div className="flex items-center gap-1 text-xs">
          <Activity className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="text-green-400 font-medium">Live</span>
        </div>
      </div>
    </div>
  )
}
