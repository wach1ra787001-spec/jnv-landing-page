import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart3, Brain, Target } from 'lucide-react'
import { BrokerLogo } from '@/components/broker-logo'
import { getTradingPlatforms } from '@/lib/broker-logos'

export function Hero() {
  const supportedPlatforms = getTradingPlatforms()

  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24 lg:px-8 lg:pt-40 lg:pb-32">
      {/* Background gradient effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2">
          <span className="flex h-2 w-2 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Institutional-Grade Trading Tools</span>
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Your Trading Performance
          <span className="block text-primary">Operating System</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
          Transform scattered trading data into actionable insights. AI-powered journaling, 
          behavioral coaching, and performance analytics built for traders who demand excellence.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="gap-2">
            <Link href="/auth/sign-up">
              Start 14-Day Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">See How It Works</Link>
          </Button>
        </div>

        {/* Key metrics */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-6">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">50+</span>
            <span className="text-sm text-muted-foreground">Performance Metrics</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-6">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">AI</span>
            <span className="text-sm text-muted-foreground">Behavioral Coach</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-6">
            <Target className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MT5</span>
            <span className="text-sm text-muted-foreground">Native Integration</span>
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="mt-20 pt-16 border-t border-border/50">
          <p className="text-sm font-medium text-muted-foreground mb-6">Works with all major trading platforms</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {supportedPlatforms.map((platform) => (
              <div key={platform.shortName} className="flex items-center justify-center">
                <BrokerLogo source={platform.shortName.toLowerCase()} size="md" showTooltip={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
