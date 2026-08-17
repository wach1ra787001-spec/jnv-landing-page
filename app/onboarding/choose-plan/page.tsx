"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Zap, Star, Crown, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Plan Data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "premium",
    name: "Premium",
    icon: Star,
    monthlyPrice: 24.88,
    yearlyPrice: 247.80,
    color: "text-primary",
    borderColor: "border-border",
    badgeColor: "bg-primary/10 text-primary",
    popular: false,
    description: "For serious traders building consistent habits",
    features: [
      "Manual, CSV & MT4/MT5 data import",
      "Access to Playbooks",
      "Monthly data impressions",
      "Import up to 100 trades/month",
      "1 screenshot per trade",
      "Up to 2 trading accounts",
      "Community support",
      "In-app toast notifications",
      "High risk trade alerts",
    ],
    notIncluded: [
      "Community templates",
      "M/M Analytics",
      "Unlimited trade imports",
      "Advanced Analytics",
      "AI credits",
      "AI Coach",
      "Backtesting feature",
      "AI journalling assistant",
      "Accountability management",
    ],
  },
  {
    id: "pro",
    name: "PRO",
    icon: Zap,
    monthlyPrice: 44.88,
    yearlyPrice: 446.80,
    color: "text-white",
    borderColor: "border-primary",
    badgeColor: "bg-white/10 text-white",
    popular: true,
    description: "For growth-focused traders who want an edge",
    features: [
      "Everything in Premium",
      "Community template creation",
      "Month-over-Month Analytics",
      "Unlimited trade imports",
      "Up to 5 screenshots per trade",
      "Up to 5 trading accounts",
      "Access to Advanced Analytics",
      "500 AI credits per month",
      "Access to AI Coach",
    ],
    notIncluded: [
      "Backtesting feature",
      "AI journalling assistant",
      "AI trade follow-up & email alerts",
      "Accountability management",
      "Custom integrations",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    icon: Crown,
    monthlyPrice: 74.88,
    yearlyPrice: 745.80,
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    badgeColor: "bg-amber-500/10 text-amber-400",
    popular: false,
    description: "For elite traders who demand the full arsenal",
    features: [
      "Everything in PRO & Premium",
      "Backtesting feature",
      "AI journalling — transcription & note revision",
      "AI trade follow-up & email notifications",
      "Open position monitoring",
      "Accountability management",
      "Strategy intervention sessions",
      "Custom integrations",
      "Unlimited trading accounts",
    ],
    notIncluded: [],
  },
]

// ─── Comparison Table Data ────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { feature: "Manual & CSV import", premium: true, pro: true, elite: true },
  { feature: "MT4/MT5 integration", premium: true, pro: true, elite: true },
  { feature: "Trading accounts", premium: "2", pro: "5", elite: "Unlimited" },
  { feature: "Trade imports/month", premium: "100", pro: "Unlimited", elite: "Unlimited" },
  { feature: "Screenshots per trade", premium: "1", pro: "5", elite: "5" },
  { feature: "Playbooks", premium: true, pro: true, elite: true },
  { feature: "Community support", premium: true, pro: true, elite: true },
  { feature: "In-app notifications", premium: true, pro: true, elite: true },
  { feature: "Community templates", premium: false, pro: true, elite: true },
  { feature: "M/M Analytics", premium: false, pro: true, elite: true },
  { feature: "Advanced Analytics", premium: false, pro: true, elite: true },
  { feature: "AI credits/month", premium: false, pro: "500", elite: "Unlimited" },
  { feature: "AI Coach", premium: false, pro: true, elite: true },
  { feature: "Backtesting", premium: false, pro: false, elite: true },
  { feature: "AI journalling assistant", premium: false, pro: false, elite: true },
  { feature: "AI trade follow-up", premium: false, pro: false, elite: true },
  { feature: "Email & open position alerts", premium: false, pro: false, elite: true },
  { feature: "Accountability management", premium: false, pro: false, elite: true },
  { feature: "Custom integrations", premium: false, pro: false, elite: true },
]

// ─── Cell helper ─────────────────────────────────────────────────────────────

function Cell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === "string") {
    return (
      <td className={`px-6 py-3.5 text-center text-sm font-medium ${highlight ? "text-white" : "text-foreground"}`}>
        {value}
      </td>
    )
  }
  return (
    <td className="px-6 py-3.5 text-center">
      {value ? (
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${highlight ? "bg-white/20" : "bg-primary/10"}`}>
          <Check className={`w-3 h-3 ${highlight ? "text-white" : "text-primary"}`} />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted/50">
          <X className="w-3 h-3 text-muted-foreground/40" />
        </span>
      )}
    </td>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChoosePlanPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [selecting, setSelecting] = useState<string | null>(null)
  const router = useRouter()

  const discount = 17

  function handleSelectPlan(planId: string) {
    setSelecting(planId)
    // TODO: integrate Paddle checkout — for now navigate to success
    router.push(`/onboarding/payment-success?plan=${planId}&billing=${billing}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-tight">JnV Journal</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hidden sm:block">Step 3 of 4 — Choose your plan</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-14">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Check className="w-3 h-3" />
            Email verified — you&apos;re almost in
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            Choose your plan
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
            Start your 3-day free trial. Cancel anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium transition-colors ${billing === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${billing === "yearly" ? "bg-primary" : "bg-muted"}`}
            role="switch"
            aria-checked={billing === "yearly"}
            aria-label="Toggle yearly billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${billing === "yearly" ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${billing === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
          </span>
          {billing === "yearly" && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
              Save {discount}%
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
            const perMonth = billing === "yearly" ? (plan.yearlyPrice / 12).toFixed(2) : null

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 flex flex-col transition-all duration-200 ${
                  plan.popular
                    ? "bg-primary border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                    : "bg-card border-border hover:border-border/80"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-white text-primary text-xs font-bold shadow-sm whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${plan.popular ? "bg-white/15" : "bg-primary/10"}`}>
                      <Icon className={`w-4.5 h-4.5 ${plan.popular ? "text-white" : plan.id === "elite" ? "text-amber-400" : "text-primary"}`} />
                    </div>
                    <div>
                      <h2 className={`font-bold text-base ${plan.popular ? "text-white" : "text-foreground"}`}>{plan.name}</h2>
                      <p className={`text-xs leading-relaxed ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-bold tracking-tight ${plan.popular ? "text-white" : "text-foreground"}`}>
                        ${price.toFixed(2)}
                      </span>
                      <span className={`text-sm mb-1 ${plan.popular ? "text-white/60" : "text-muted-foreground"}`}>
                        /{billing === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    {perMonth && (
                      <p className={`text-xs mt-0.5 ${plan.popular ? "text-white/60" : "text-muted-foreground"}`}>
                        ${perMonth}/month, billed annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.popular ? "bg-white/20" : "bg-primary/10"}`}>
                          <Check className={`w-2.5 h-2.5 ${plan.popular ? "text-white" : "text-primary"}`} />
                        </span>
                        <span className={plan.popular ? "text-white/90" : "text-foreground/80"}>{f}</span>
                      </li>
                    ))}
                    {plan.notIncluded.slice(0, 2).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                        <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center bg-muted/60">
                          <X className="w-2.5 h-2.5 text-muted-foreground" />
                        </span>
                        <span className={plan.popular ? "text-white/60" : "text-muted-foreground"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  <Button
                    className={`w-full font-semibold transition-all ${
                      plan.popular
                        ? "bg-white text-primary hover:bg-white/90"
                        : plan.id === "elite"
                        ? "bg-amber-500 hover:bg-amber-400 text-white border-0"
                        : ""
                    }`}
                    variant={plan.popular || plan.id === "elite" ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selecting !== null}
                  >
                    {selecting === plan.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Get started
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                  <p className={`text-xs text-center mt-2 ${plan.popular ? "text-white/50" : "text-muted-foreground"}`}>
                    3-day free trial. Cancel anytime.
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Comparison table */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Full feature comparison</h2>
            <p className="text-muted-foreground text-sm">See exactly what&apos;s included in each plan</p>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left font-semibold text-foreground bg-muted/30 w-1/2">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground bg-muted/30">
                      <div className="flex flex-col items-center gap-1">
                        <Star className="w-4 h-4 text-primary" />
                        <span>Premium</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold bg-primary text-white">
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>PRO</span>
                        <span className="text-xs font-normal text-white/70">Most Popular</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-foreground bg-muted/30">
                      <div className="flex flex-col items-center gap-1">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Elite</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.feature}</td>
                      <Cell value={row.premium} />
                      <Cell value={row.pro} highlight />
                      <Cell value={row.elite} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          All plans include a 3-day free trial. Cancel anytime. Prices are in USD and billed in advance.
        </p>
      </div>
    </div>
  )
}
