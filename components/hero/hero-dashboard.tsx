import { TrendingUp, BarChart3, Target, AlertCircle, Bell, AlertTriangle } from 'lucide-react'
import { heroPreviewData } from '@/lib/mock/hero-preview'

export function HeroDashboard() {
  const { greeting, kpis, openPositions, notifications } = heroPreviewData.dashboard

  return (
    <div className="w-full h-full pt-5 pl-5 pr-6 pb-6 bg-gradient-to-br from-background to-background/95">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground/80 mb-1">Dashboard</h2>
        <p className="text-xs text-foreground/60">Wednesday, June 3, 2026</p>
      </div>

      {/* Greeting Card */}
      <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 mb-4 border border-border/50">
        <h3 className="text-xl font-bold text-foreground mb-1">Good Evening, {greeting.name}</h3>
        <p className="text-sm text-foreground/70 italic mb-3">{greeting.quote}</p>
        <div className="flex gap-3">
          <button className="text-xs px-3 py-2 rounded border border-border hover:bg-muted transition-colors font-medium text-foreground">
            Monthly Performance Overview
          </button>
          <div className="text-xs text-green-600 font-medium px-3 py-2 flex items-center gap-1">
            ✓ Streak: {greeting.disciplinedDaysCount} disciplined days
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-border/50"
          >
            <p className="text-xs font-semibold text-foreground/70 mb-2">{kpi.label}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
              {kpi.icon === 'TrendingUp' && (
                <TrendingUp className="w-4 h-4" style={{ color: kpi.color }} />
              )}
              {kpi.icon === 'BarChart3' && (
                <BarChart3 className="w-4 h-4" style={{ color: kpi.color }} />
              )}
              {kpi.icon === 'Target' && <Target className="w-4 h-4" style={{ color: kpi.color }} />}
              {kpi.icon === 'Circle' && <AlertCircle className="w-4 h-4" style={{ color: kpi.color }} />}
            </div>
            <p className="text-xs text-foreground/60 mt-1 font-medium">{kpi.change}</p>
          </div>
        ))}
      </div>

      {/* Open Positions Section */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-foreground/70 mb-2">Open Positions ({openPositions.length})</p>
        <div className="space-y-2">
          {openPositions.slice(0, 2).map((position) => (
            <div key={position.id} className="bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-border/50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-foreground">{position.pair}</p>
                  <p className="text-xs text-foreground/60">{position.type} @ {position.entry}</p>
                </div>
                <p className="text-xs font-bold text-green-600">{position.pnl}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <Bell className="w-3 h-3 text-foreground/70" />
          <p className="text-xs font-semibold text-foreground/70">Alerts ({notifications.length})</p>
        </div>
        <div className="space-y-1">
          {notifications.slice(0, 2).map((notif) => (
            <div
              key={notif.id}
              className={`text-xs p-2 rounded border ${
                notif.severity === 'warning'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600'
                  : notif.severity === 'caution'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-600'
              }`}
            >
              <div className="flex items-start gap-2">
                {notif.severity === 'warning' && <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="font-medium">{notif.message}</p>
                  <p className="text-xs opacity-75">{notif.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
