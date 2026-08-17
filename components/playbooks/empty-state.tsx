import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookMarked, Target, BarChart3, Users } from 'lucide-react'

interface PlaybookEmptyStateProps {
  onCreateClick: () => void
}

export function PlaybookEmptyState({ onCreateClick }: PlaybookEmptyStateProps) {
  return (
    <Card className="border-border overflow-hidden">
      <div className="p-12 md:p-16 text-center space-y-8">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-primary rounded-full blur-3xl" />
        </div>

        {/* Icon */}
        <div className="relative flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <BookMarked className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Turn Your Strategy Into a Repeatable Edge
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Create playbooks to document, organize, and refine your trading strategies.
            <br className="hidden sm:block" />
            Track what works. Eliminate what doesn&apos;t. Scale with confidence.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 py-8 relative">
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto" style={{ backgroundColor: 'rgba(9, 12, 155, 0.08)' }}>
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Stay Consistent</h3>
              <p className="text-sm text-muted-foreground">
                Follow proven steps every time you trade.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto" style={{ backgroundColor: 'rgba(9, 12, 155, 0.13)' }}>
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Track What Works</h3>
              <p className="text-sm text-muted-foreground">
                Review performance and improve over time.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto" style={{ backgroundColor: 'rgba(9, 12, 155, 0.11)' }}>
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Build Your Edge</h3>
              <p className="text-sm text-muted-foreground">
                Systemize your process and scale with clarity.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-2 relative">
          <Button
            onClick={onCreateClick}
            size="lg"
            className="w-full md:w-auto gap-2 px-8"
          >
            <span>+</span>
            New Playbook
          </Button>
          <p className="text-sm text-muted-foreground">
            Get started in seconds and build your first playbook today.
          </p>
        </div>
      </div>
    </Card>
  )
}
