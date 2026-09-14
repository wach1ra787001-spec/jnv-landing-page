"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Bug, ChevronDown, LifeBuoy, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const faqs = [
  {
    question: "How do I add a trade?",
    answer: "Open Trade Journal, select Add a Trade, complete the form, and save your entry.",
  },
  {
    question: "How do I connect a broker?",
    answer: "Open Settings, choose Broker & Import, and select the connection or CSV import option you want to use.",
  },
  {
    question: "How should I report a bug?",
    answer: "Email support with the page where the problem happened, what you expected, and a screenshot if available.",
  },
]

export default function SupportSettingsPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold text-foreground">Support</h1>
        <p className="text-muted-foreground">Get help with your journal, broker connections, and account.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="border border-border/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground">Contact Support</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Send us details about your question or issue and our team will help.
              </p>
              <Button asChild className="mt-4 gap-2">
                <a href="mailto:support@jnvtradingjournal.com?subject=JnV%20Trading%20Journal%20Support">
                  <MessageSquare className="h-4 w-4" />
                  Email support
                </a>
              </Button>
              <p className="mt-3 break-all text-xs text-muted-foreground">support@jnvtradingjournal.com</p>
            </div>
          </div>
        </Card>

        <Card className="border border-border/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Report a Bug</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Include the page, steps to reproduce the problem, and what you expected to happen.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-border/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 pr-6 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
