"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "Up to 50 trades/month",
      "Basic analytics",
      "Manual trade entry",
      "Community support",
    ],
    current: false,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious traders",
    features: [
      "Unlimited trades",
      "Advanced analytics",
      "MT4/MT5 integration",
      "AI-powered insights",
      "Priority support",
      "Trade screenshots",
    ],
    current: true,
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$79",
    period: "/month",
    description: "For professional traders",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Team collaboration",
      "White-label options",
      "Dedicated support",
      "API access",
      "Advanced reporting",
    ],
    current: false,
    popular: false,
  },
]

export function SubscriptionTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Subscription Plans</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the plan that best fits your trading needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative border rounded-lg p-5 bg-background transition-all",
              plan.current
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            )}
          >
            {plan.current && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Current Plan
              </Badge>
            )}

            {plan.popular && !plan.current && (
              <Badge
                variant="secondary"
                className="absolute -top-2.5 left-1/2 -translate-x-1/2"
              >
                Most Popular
              </Badge>
            )}

            <div className="text-center mb-4 pt-2">
              <h4 className="text-lg font-semibold text-foreground">{plan.name}</h4>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-chart-1 mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={plan.current ? "outline" : "default"}
              className="w-full"
              disabled={plan.current}
            >
              {plan.current ? "Current Plan" : "Upgrade"}
            </Button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">
              Current billing period ends on <span className="font-medium">April 15, 2026</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your Pro plan will automatically renew
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            Cancel Subscription
          </Button>
        </div>
      </div>
    </div>
  )
}
