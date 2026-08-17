'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureFlag {
  key: string
  label: string
  description: string
  enabled: boolean
}

export function AdminFeatureFlagsClient({ flags: initial }: { flags: FeatureFlag[] }) {
  const [flags, setFlags] = useState(initial)

  function toggle(key: string) {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f))
  }

  return (
    <div className="space-y-2">
      {flags.map(flag => (
        <Card key={flag.key} className="p-4 bg-card border border-border/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Flag className={cn('w-4 h-4', flag.enabled ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <p className="font-medium text-foreground text-sm">{flag.label}</p>
                <p className="text-xs text-muted-foreground">{flag.description}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(flag.key)}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                flag.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                  flag.enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
