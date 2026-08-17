import Image from 'next/image'
import { getBrokerLogo } from '@/lib/broker-logos'
import { cn } from '@/lib/utils'

interface BrokerLogoProps {
  source: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showTooltip?: boolean
  className?: string
}

const sizeMap = {
  xs: { container: 'w-6 h-6', image: 24 },
  sm: { container: 'w-8 h-8', image: 32 },
  md: { container: 'w-10 h-10', image: 40 },
  lg: { container: 'w-12 h-12', image: 48 },
}

export function BrokerLogo({
  source,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  className,
}: BrokerLogoProps) {
  const broker = getBrokerLogo(source)
  const sizeConfig = sizeMap[size]

  // For manual and csv entries without logos, show a badge instead
  if (!broker.logo) {
    return (
      <div
        className={cn(
          sizeConfig.container,
          'flex items-center justify-center bg-muted rounded-lg text-xs font-semibold text-muted-foreground',
          className,
        )}
        title={showTooltip ? broker.description : undefined}
      >
        {broker.shortName}
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      title={showTooltip ? broker.description : undefined}
    >
      <div className={cn(sizeConfig.container, 'relative flex-shrink-0 rounded-lg overflow-hidden bg-white')}>
        <Image
          src={broker.logo}
          alt={broker.name}
          fill
          className="object-cover"
          sizes={`${sizeConfig.image}px`}
        />
      </div>
      {showLabel && <span className="text-sm font-medium text-foreground">{broker.shortName}</span>}
    </div>
  )
}
