import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Refund Policy — JNV Trading Journal',
  description: 'The refund policy for JNV Trading Journal subscriptions and market data.',
}

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Title block */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-foreground mb-3">Refund Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: July 18, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-10">

          {/* Refunds */}
          <section className="p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Refund Policy</h2>
            <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed">
              <p>
                Annual subscriptions purchased from JnV are eligible for a full refund if the refund request is submitted within 24 hours of the original purchase.
              </p>
              <p>
                Refund requests submitted after the 24-hour refund period are generally not eligible for a refund, except where a refund is required by applicable law or where JnV determines, at its sole discretion, that an exception is appropriate.
              </p>
              <p>
                Monthly subscriptions are not eligible for discretionary refunds. Cancelling a monthly subscription prevents future renewals but does not refund the current billing period.
              </p>
              <p>
                Eligible annual refunds will cancel the subscription, and the refund will be issued to the original payment method. Refund processing times may vary depending on the payment provider or financial institution.
              </p>
              <p>
                The 24-hour refund period begins when the subscription purchase is successfully completed, based on JnV&apos;s payment records.
              </p>
              <p>
                There are no refunds for upgrades to a more expensive plan, monthly plans, or market data, even if the subscription is cancelled on the same day as payment. Users who have filed a chargeback, dispute, or claim are not eligible for a refund.
              </p>
              <p>
                This refund policy does not limit or exclude consumer rights that cannot legally be waived under applicable law.
              </p>
            </div>
          </section>

          {/* Questions */}
          <section className="p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Questions</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions concerning our return policy, please contact us at:
            </p>
            <div className="text-muted-foreground leading-loose text-sm space-y-1">
              <p className="font-medium text-foreground">JNV Trading Journal</p>
              <p>
                Email:{' '}
                <a
                  href="mailto:support@jnvtradingjournal.com"
                  className="text-primary hover:underline"
                >
                  support@jnvtradingjournal.com
                </a>
              </p>
            </div>
          </section>

        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} JNV Trading Journal. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/return-policy" className="text-primary font-medium">
              Refund Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
