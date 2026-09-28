import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — JNV Trading Journal',
  description: 'How JNV Trading Journal collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: July 15, 2026</p>
        </div>

        <div className="prose-container space-y-10 text-foreground">

          {/* Intro */}
          <Section>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Notice for <strong className="text-foreground">jnvtradingjournal</strong> (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) describes how and why we might access, collect, store, use, and/or share your personal information when you use our services, including when you:
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5 text-muted-foreground">
              <li>Visit our website at <a href="https://jnvtradingjournal.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">jnvtradingjournal.com</a></li>
              <li>Use our trading journal platform and related services</li>
              <li>Engage with us in other related ways, including sales, marketing, or events</li>
            </ul>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at{' '}
              <a href="mailto:support@jnvtradingjournal.com" className="text-primary hover:underline">support@jnvtradingjournal.com</a>.
            </p>
          </Section>

          <Divider />

          <Section title="1. What Information Do We Collect?">
            <Heading2>Personal information you disclose to us</Heading2>
            <p className="text-muted-foreground leading-relaxed">
              We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products, when you participate in activities on the Services, or otherwise when you contact us.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              The personal information we collect may include the following:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-muted-foreground">
              <li>Names and email addresses</li>
              <li>Usernames and passwords</li>
              <li>Billing and payment information (processed securely via Paddle)</li>
              <li>Trading data, journal entries, screenshots, and notes you upload</li>
              <li>MT4/MT5 account connection data</li>
              <li>Contact preferences and communication data</li>
            </ul>
            <Heading2>Information automatically collected</Heading2>
            <p className="text-muted-foreground leading-relaxed">
              We automatically collect certain information when you visit, use, or navigate our Services. This may include device and usage information such as IP address, browser type, operating system, referring URLs, and pages visited. This information is primarily needed to maintain security and operation of our Services.
            </p>
          </Section>

          <Divider />

          <Section title="2. How Do We Process Your Information?">
            <p className="text-muted-foreground leading-relaxed">
              We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-muted-foreground">
              <li>To facilitate account creation, authentication, and manage user accounts</li>
              <li>To deliver and facilitate delivery of services to you</li>
              <li>To respond to user inquiries and offer support</li>
              <li>To send administrative information such as changes to our terms and policies</li>
              <li>To fulfil and manage your subscriptions and payments</li>
              <li>To send you marketing and promotional communications (with your consent)</li>
              <li>To protect our Services and investigate fraudulent activity</li>
              <li>To comply with our legal obligations</li>
            </ul>
          </Section>

          <Divider />

          <Section title="3. When and With Whom Do We Share Your Information?">
            <p className="text-muted-foreground leading-relaxed">
              We may share information in the following situations:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-muted-foreground">
              <li><strong className="text-foreground">Service Providers:</strong> We may share your data with third-party vendors and service providers that perform services for us, including payment processing (Paystack), email delivery (Resend), cloud hosting (Supabase / Vercel), and essential session infrastructure.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition, your information may be transferred.</li>
              <li><strong className="text-foreground">Legal Obligations:</strong> We may disclose your information where required to comply with applicable law or legal process.</li>
              <li><strong className="text-foreground">With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
            </ul>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
            </p>
          </Section>

          <Divider />

          <Section title="4. Do We Use Cookies and Other Tracking Technologies?">
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies and similar technologies for authentication, secure session management, CSRF protection, and core account functionality. We do not currently use non-essential advertising or analytics cookies. Blocking essential cookies may prevent the Services from functioning correctly.
            </p>
          </Section>

          <Divider />

          <Section title="5. How Long Do We Keep Your Information?">
            <p className="text-muted-foreground leading-relaxed">
              We retain information for as long as needed to provide the Services and for legitimate legal, security, fraud-prevention, dispute-resolution, accounting, and operational purposes. JnV intends to use a 30-day deletion window after a valid account-deletion workflow is implemented: during that window, the account and associated data may remain recoverable, and after it the relevant data will be permanently deleted subject to legally required records and backups that cannot immediately be overwritten. The current application does not yet implement an automated account-deletion request or 30-day purge workflow; users should contact support to request deletion while this process is being completed.
            </p>
          </Section>

          <Divider />

          <Section title="6. How Do We Keep Your Information Safe?">
            <p className="text-muted-foreground leading-relaxed">
              We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. These include encrypted data storage, secure HTTPS transmission, and access controls. However, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
            </p>
          </Section>

          <Divider />

          <Section title="7. What Are Your Privacy Rights?">
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-muted-foreground">
              <li>The right to access and receive a copy of your personal data</li>
              <li>The right to request correction of inaccurate personal data</li>
              <li>The right to request erasure of your personal data</li>
              <li>The right to object to or restrict processing of your personal data</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent at any time</li>
            </ul>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:support@jnvtradingjournal.com" className="text-primary hover:underline">support@jnvtradingjournal.com</a>.
              We will respond to your request within 30 days.
            </p>
          </Section>

          <Divider />

          <Section title="8. How Does JnV AI Process Information?">
            <p className="text-muted-foreground leading-relaxed">When you use an AI-powered feature, JnV AI may process the trading and performance information reasonably necessary to provide personalized coaching, trade reviews, pattern analysis, recommendations, alerts, and related functionality. This may include trading history, executed and missed trades, positions, entry and exit information, stop-loss and take-profit information, risk and position sizing, PnL, R:R, statistics, drawdown, consistency, streaks, progress tracking, strategies, playbooks, rules, tags, notes, journal entries, backtesting results, and screenshots you upload.</p>
            <p className="mt-3 text-muted-foreground leading-relaxed">The AI feature is not intended to access unrelated information such as billing details, card credentials, passwords, authentication credentials, broker or API credentials, API keys, OAuth secrets, government identification, or unrelated account information. This is a description of intended feature access, not a guarantee that technical systems can never expose such information; JnV uses access controls and data minimization to limit processing to what is needed for the requested feature.</p>
            <p className="mt-3 text-muted-foreground leading-relaxed">The current AI coach sends the user&apos;s request message and any context included with that request to OpenAI through its API to generate a response. OpenAI processes that information on JnV&apos;s behalf for the AI request. JnV does not sell this information or disclose it for unrelated marketing purposes.</p>
          </Section>

          <Divider />

          <Section title="9. Account Deletion and User Control">
            <p className="text-muted-foreground leading-relaxed">You may request access, correction, or deletion of information by contacting support@jnvtradingjournal.com. JnV intends to place deletion requests into a 30-day retention window before permanent deletion, subject to legal, security, accounting, dispute-resolution, and backup exceptions. The current application does not yet provide an automated deletion-request or recovery flow, so the exact access and cancellation behavior is not currently implemented.</p>
          </Section>

          <Divider />

          <Section title="10. Do We Make Updates to This Notice?">
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Notice from time to time. The updated version will be indicated by a revised &quot;Last updated&quot; date. We will notify you of any material changes by posting the new notice on this page and, where appropriate, via email to the address associated with your account.
            </p>
          </Section>

          <Divider />

          <Section title="11. How Can You Contact Us?">
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or comments about this notice, you may contact us at:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-card border border-border text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">JNV Trading Journal</p>
              <p>Email: <a href="mailto:support@jnvtradingjournal.com" className="text-primary hover:underline">support@jnvtradingjournal.com</a></p>
              <p>Website: <a href="https://jnvtradingjournal.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">jnvtradingjournal.com</a></p>
              <p>Address: United, Dubai, United Arab Emirates</p>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JNV Trading Journal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-primary font-medium">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      {title && (
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      )}
      {children}
    </section>
  )
}

function Heading2({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-6 mb-2">{children}</h3>
}

function Divider() {
  return <hr className="border-border" />
}
