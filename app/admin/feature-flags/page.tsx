import { Card } from '@/components/ui/card'
import { Flag } from 'lucide-react'
import { AdminFeatureFlagsClient } from '@/components/admin/admin-feature-flags-client'

// Default feature flags — in production these would be stored in a DB table
export const defaultFlags = [
  { key: 'ai_chat', label: 'AI Chat', description: 'Enable AI coaching and chat features', enabled: true },
  { key: 'mt5_import', label: 'MT5 Import', description: 'Enable MT5 broker connection and auto-import', enabled: true },
  { key: 'csv_import', label: 'CSV Import', description: 'Allow manual CSV trade imports', enabled: true },
  { key: 'backtest', label: 'Backtesting', description: 'Enable the backtesting module', enabled: true },
  { key: 'daily_review', label: 'Daily Review AI', description: 'AI-powered daily review summaries', enabled: true },
  { key: 'beta_dashboard', label: 'Beta Dashboard', description: 'New dashboard layout (beta)', enabled: false },
  { key: 'journal_templates', label: 'Journal Templates', description: 'Pre-built journal entry templates', enabled: false },
]

export default function AdminFeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">Enable or disable platform features for staged rollouts</p>
      </div>
      <AdminFeatureFlagsClient flags={defaultFlags} />
    </div>
  )
}
