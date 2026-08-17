import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Perfect for traders getting started with journaling.',
    features: [
      'Manual trade logging',
      'Basic performance metrics',
      'Up to 50 trades/month',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/auth/sign-up',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For serious traders who want to maximize their edge.',
    features: [
      'Everything in Starter',
      'MT5 auto-sync',
      'AI behavioral coaching',
      'Unlimited trades',
      '50+ advanced metrics',
      'Chart screenshot storage',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/auth/sign-up',
    popular: true,
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    description: 'For prop firms and trading teams.',
    features: [
      'Everything in Pro',
      'Up to 10 traders',
      'Team analytics dashboard',
      'Custom API access',
      'White-label options',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    href: '/auth/sign-up',
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Start free and upgrade as your trading evolves. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col border-border/50 ${
                plan.popular ? 'border-primary bg-card' : 'bg-card/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
