import { Card } from '@/components/ui/card'
import { Megaphone } from 'lucide-react'

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">Send platform updates and notifications to users</p>
      </div>
      <Card className="p-8 bg-card border border-border/50 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Megaphone className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Announcements Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This section will allow sending targeted announcements by subscription tier, feature updates, and maintenance notices.
        </p>
      </Card>
    </div>
  )
}
