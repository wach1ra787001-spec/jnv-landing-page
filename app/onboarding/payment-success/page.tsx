"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Zap, ArrowRight, Star, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"

const PLAN_DETAILS: Record<string, { name: string; icon: React.ElementType; color: string; perks: string[] }> = {
  premium: {
    name: "Premium",
    icon: Star,
    color: "text-primary",
    perks: ["MT4/MT5 import ready", "Playbooks unlocked", "Up to 2 trading accounts"],
  },
  pro: {
    name: "PRO",
    icon: Zap,
    color: "text-primary",
    perks: ["500 AI credits activated", "Advanced Analytics unlocked", "Up to 5 trading accounts"],
  },
  elite: {
    name: "Elite",
    icon: Crown,
    color: "text-amber-400",
    perks: ["Unlimited AI credits", "Backtesting & AI Coach", "Unlimited trading accounts"],
  },
}

const ONBOARDING_STEPS = [
  { label: "Account created", done: true },
  { label: "Email verified", done: true },
  { label: "Plan selected", done: true },
  { label: "Complete onboarding", done: false },
]

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get("plan") ?? "pro"
  const billing = searchParams.get("billing") ?? "monthly"
  const plan = PLAN_DETAILS[planId] ?? PLAN_DETAILS.pro
  const Icon = plan.icon

  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          router.push("/dashboard")
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Glow background accent */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.08) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative w-full max-w-md text-center">

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            {/* Plan badge */}
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-card border-2 border-background flex items-center justify-center">
              <Icon className={`w-4 h-4 ${plan.color}`} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          You&apos;re all set!
        </h1>
        <p className="text-muted-foreground mb-1">
          Welcome to JnV Journal —{" "}
          <span className="font-semibold text-foreground">{plan.name}</span> plan activated
        </p>
        <p className="text-xs text-muted-foreground mb-8 capitalize">
          {billing === "yearly" ? "Billed annually" : "Billed monthly"} · 7-day free trial started
        </p>

        {/* Plan perks */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-8 text-left">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            What&apos;s now unlocked
          </p>
          <ul className="space-y-2.5">
            {plan.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  step.done
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < ONBOARDING_STEPS.length - 1 && (
                <div className={`w-4 h-px ${step.done ? "bg-emerald-500/30" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          className="w-full font-semibold"
          onClick={() => router.push("/dashboard")}
        >
          Go to dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Redirecting automatically in{" "}
          <span className="font-semibold text-foreground tabular-nums">{countdown}s</span>
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
