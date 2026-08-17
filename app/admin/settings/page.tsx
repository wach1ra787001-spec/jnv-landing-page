import { Card } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Global configuration, AI limits, and platform defaults</p>
      </div>
      <Card className="p-8 bg-card border border-border/50 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">System Settings Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Platform-wide configuration including AI token limits, email templates, maintenance mode, and default application settings.
        </p>
      </Card>
    </div>
  )
}
