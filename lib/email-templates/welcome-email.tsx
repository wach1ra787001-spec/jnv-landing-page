import React from 'react'

interface WelcomeEmailProps {
  name: string
  email: string
  dashboardUrl: string
}

export const WelcomeEmailTemplate: React.FC<WelcomeEmailProps> = ({
  name,
  email,
  dashboardUrl,
}) => {
  const firstName = name?.split(' ')[0] || 'Trader'

  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', backgroundColor: '#f5f4f0', padding: '40px 0' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '4px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ backgroundColor: '#0a0a0a', padding: '32px 48px' }}>
          <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', letterSpacing: '0.08em', margin: '0', textTransform: 'uppercase', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            JNV Pro
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '48px 48px 40px', backgroundColor: '#ffffff' }}>
          <p style={{ color: '#111111', fontSize: '16px', lineHeight: '1.7', margin: '0 0 20px 0' }}>
            Hi {firstName},
          </p>

          <p style={{ color: '#111111', fontSize: '16px', lineHeight: '1.8', margin: '0 0 24px 0' }}>
            Most traders lose money not because of bad strategy — but because nobody&apos;s holding them accountable to their own rules. That changes today.
          </p>

          <p style={{ color: '#111111', fontSize: '16px', lineHeight: '1.8', margin: '0 0 32px 0' }}>
            You&apos;re now part of a journal built by traders, for traders — not another analytics dashboard pretending to understand your psychology.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '0 0 32px 0' }} />

          <p style={{ color: '#111111', fontSize: '15px', fontWeight: '600', margin: '0 0 20px 0', fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
            Here&apos;s what to expect from here:
          </p>

          {/* Point 1 */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#111111', fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              You&apos;ll be held accountable.
            </p>
            <p style={{ color: '#444444', fontSize: '15px', lineHeight: '1.8', margin: '0' }}>
              JNV Pro doesn&apos;t just log your trades — it enforces the discipline you already know you need. Every entry, every rule, every streak is tracked so you can&apos;t quietly lie to yourself about &ldquo;just this one trade.&rdquo;
            </p>
          </div>

          {/* Point 2 */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#111111', fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              You&apos;ll actually want to journal.
            </p>
            <p style={{ color: '#444444', fontSize: '15px', lineHeight: '1.8', margin: '0' }}>
              We built the best note-taking experience in the industry because your reasoning matters more than your P&amp;L. Screenshots, tags, emotional state, setup quality — captured in seconds, not buried in a spreadsheet.
            </p>
          </div>

          {/* Point 3 */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#111111', fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              We&apos;ll check in on you.
            </p>
            <p style={{ color: '#444444', fontSize: '15px', lineHeight: '1.8', margin: '0' }}>
              Over the next few days, you&apos;ll get a short series of emails — not sales pitches, but a walk through the tools that&apos;ll actually move your trading forward, one at a time.
            </p>
          </div>

          {/* Point 4 */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#111111', fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Your feedback shapes this.
            </p>
            <p style={{ color: '#444444', fontSize: '15px', lineHeight: '1.8', margin: '0' }}>
              We&apos;ve built the best feedback loop in the space because a trading journal should evolve with the traders using it. You&apos;ll always have a direct line to us.
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '32px 0' }} />

          <p style={{ color: '#111111', fontSize: '15px', lineHeight: '1.8', margin: '0 0 16px 0' }}>
            This is the most trader-oriented journal out there. Not built for accountants. Not built for spreadsheets. Built for the person sitting in front of the charts at 6am.
          </p>

          <p style={{ color: '#111111', fontSize: '15px', lineHeight: '1.8', margin: '0 0 32px 0' }}>
            And above all — we focus on you, not just your numbers. Your win rate is a symptom. Your process is the cause. JNV Pro is built to help you see the difference.
          </p>

          <p style={{ color: '#333333', fontSize: '15px', lineHeight: '1.8', margin: '0 0 32px 0', fontStyle: 'italic' }}>
            Take two minutes right now and log your first trade — even a past one. The sooner you start, the sooner the patterns start talking back to you.
          </p>

          {/* CTA Button */}
          <div style={{ margin: '0 0 40px 0' }}>
            <a
              href={dashboardUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#0a0a0a',
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: '3px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '0.04em',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Log Your First Trade &rarr;
            </a>
          </div>

          <p style={{ color: '#111111', fontSize: '15px', lineHeight: '1.7', margin: '0 0 8px 0' }}>
            Glad you&apos;re here.
          </p>
          <p style={{ color: '#111111', fontSize: '15px', lineHeight: '1.7', margin: '0' }}>
            — The JNV Pro Team
          </p>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: '#f5f4f0', padding: '24px 48px', borderTop: '1px solid #e8e8e8' }}>
          <p style={{ color: '#999999', fontSize: '12px', lineHeight: '1.6', margin: '0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            This email was sent to {email} because you recently created a JNV Pro account.
          </p>
        </div>

      </div>
    </div>
  )
}
