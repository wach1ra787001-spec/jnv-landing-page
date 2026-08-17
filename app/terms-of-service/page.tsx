import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — JNV Trading Journal',
  description: 'The legal terms and conditions governing your use of JNV Trading Journal.',
}

export default function TermsOfServicePage() {
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
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Title block */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-foreground mb-3">Terms and Conditions</h1>
          <p className="text-muted-foreground text-sm">Last updated: July 18, 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-5 rounded-2xl bg-card border border-border">
          <p className="text-sm font-semibold text-foreground mb-4">Table of Contents</p>
          <ol className="space-y-1.5 text-sm text-primary">
            {[
              'Agreement to Our Legal Terms',
              'Our Services',
              'Intellectual Property Rights',
              'User Representations',
              'User Registration',
              'Purchases and Payment',
              'Subscriptions',
              'Prohibited Activities',
              'User Generated Contributions',
              'Contribution Licence',
              'Services Management',
              'Privacy Policy',
              'Term and Termination',
              'Modifications and Interruptions',
              'Governing Law',
              'Dispute Resolution',
              'Disclaimer of Warranties',
              'Limitations of Liability',
              'Indemnification',
              'Contact Us',
            ].map((item, i) => (
              <li key={i}>
                <a
                  href={`#section-${i + 1}`}
                  className="hover:underline hover:text-primary/80 transition-colors"
                >
                  {i + 1}. {item}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-10 text-foreground">

          {/* Intro */}
          <section className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              We are <strong className="text-foreground">jnvtradingjournal</strong> (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; &quot;our&quot;), a company registered in the United Arab Emirates at United, Dubai.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We operate the website{' '}
              <a href="https://jnvtradingjournal.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://jnvtradingjournal.com</a>{' '}
              (the &quot;Site&quot;), as well as any other related products and services that refer or link to these legal terms (collectively, the &quot;Services&quot;).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We enforce accountability to traders to sharpen their pattern recognition and better their overall trading skills.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You can contact us by email at{' '}
              <a href="mailto:support@jnvtradingjournal.com" className="text-primary hover:underline">support@jnvtradingjournal.com</a>{' '}
              or by mail to United, Dubai, United Arab Emirates.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              These Legal Terms constitute a legally binding agreement between you and jnvtradingjournal concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms.{' '}
              <strong className="text-foreground">IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.
            </p>
          </section>

          <Divider />

          <Section id="section-1" title="1. Agreement to Our Legal Terms">
            <p className="text-muted-foreground leading-relaxed">
              By using our Services you confirm that you are at least 18 years of age, have the legal capacity to enter into binding contracts, and agree to comply with and be bound by these Terms. We reserve the right to change or modify these Terms at any time. We will notify you of material changes by email or via a notice on the Services. Your continued use after the effective date constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Divider />

          <Section id="section-2" title="2. Our Services">
            <p className="text-muted-foreground leading-relaxed">
              JNV Trading Journal provides a professional-grade trading journal platform including, but not limited to: trade logging, performance analytics, AI-powered coaching, MT4/MT5 integration, playbooks, community features, and accountability management tools. The information provided through the Services is not intended as financial, investment, or trading advice.
            </p>
          </Section>

          <Divider />

          <Section id="section-3" title="3. Intellectual Property Rights">
            <p className="text-muted-foreground leading-relaxed">
              We are the owner or licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics (collectively, the &quot;Content&quot;), as well as the trademarks, service marks, and logos contained therein (the &quot;Marks&quot;).
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Subject to your compliance with these Terms, we grant you a non-exclusive, non-transferable, revocable licence to access the Services solely for your personal, non-commercial use. No part of the Services, Content, or Marks may be copied, reproduced, republished, uploaded, posted, publicly displayed, transmitted, distributed, sold, or otherwise exploited for any commercial purpose without our express prior written permission.
            </p>
          </Section>

          <Divider />

          <Section id="section-4" title="4. User Representations">
            <p className="text-muted-foreground leading-relaxed">By using the Services, you represent and warrant that:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-muted-foreground">
              <li>All registration information you submit will be true, accurate, current, and complete</li>
              <li>You will maintain the accuracy of such information and promptly update it as necessary</li>
              <li>You have the legal capacity and agree to comply with these Terms</li>
              <li>You are not a minor in the jurisdiction in which you reside (i.e., you are at least 18)</li>
              <li>You will not access the Services through automated or non-human means</li>
              <li>You will not use the Services for any illegal or unauthorised purpose</li>
              <li>Your use of the Services will not violate any applicable law or regulation</li>
            </ul>
          </Section>

          <Divider />

          <Section id="section-5" title="5. User Registration">
            <p className="text-muted-foreground leading-relaxed">
              You may be required to register with the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
            </p>
          </Section>

          <Divider />

          <Section id="section-6" title="6. Purchases and Payment">
            <p className="text-muted-foreground leading-relaxed">
              All purchases are processed securely through <strong className="text-foreground">Paddle</strong>, our authorised merchant of record. Paddle is responsible for billing, invoicing, and handling all payment-related queries. We accept major credit/debit cards and other payment methods as available through Paddle.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You agree to provide current, complete, and accurate purchase and account information for all transactions. Prices are in USD unless otherwise indicated. We reserve the right to change prices at any time.
            </p>
          </Section>

          <Divider />

          <Section id="section-7" title="7. Subscriptions">
            <p className="text-muted-foreground leading-relaxed">
              The Services are billed on a subscription basis. You will be billed in advance on a recurring monthly or annual basis depending on the plan you select. A <strong className="text-foreground">3-day free trial</strong> is included with all plans. Your subscription automatically renews unless you cancel before the renewal date.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time through your account settings or by contacting us. Cancellation takes effect at the end of the current billing period. We do not provide refunds for partial billing periods unless required by applicable law.
            </p>
          </Section>

          <Divider />

          <Section id="section-8" title="8. Prohibited Activities">
            <p className="text-muted-foreground leading-relaxed">You may not access or use the Services for any purpose other than that for which we make the Services available. The following activities are prohibited:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-muted-foreground">
              <li>Systematically retrieving data or content to create a database or directory without written permission</li>
              <li>Circumventing, disabling, or interfering with security-related features of the Services</li>
              <li>Uploading or transmitting viruses, malware, or other harmful material</li>
              <li>Using the Services to advertise or offer to sell goods and services</li>
              <li>Engaging in any automated use of the system such as using scripts to send comments or messages</li>
              <li>Attempting to impersonate another user or person</li>
              <li>Using the Services in a manner inconsistent with any applicable laws or regulations</li>
              <li>Harassing, annoying, intimidating, or threatening any of our employees, agents, or users</li>
            </ul>
          </Section>

          <Divider />

          <Section id="section-9" title="9. User Generated Contributions">
            <p className="text-muted-foreground leading-relaxed">
              The Services may allow you to create, submit, post, display, transmit, or distribute content such as trade notes, journal entries, screenshots, playbooks, and community templates (&quot;Contributions&quot;). You are solely responsible for your Contributions and represent that they do not infringe on any third-party rights and comply with all applicable laws.
            </p>
          </Section>

          <Divider />

          <Section id="section-10" title="10. Contribution Licence">
            <p className="text-muted-foreground leading-relaxed">
              By posting Contributions to any part of the Services, you grant us a non-exclusive, worldwide, royalty-free licence to use, copy, reproduce, process, adapt, and display your Contributions solely for the purpose of providing and improving the Services. You retain all ownership rights to your Contributions. We do not claim ownership of your trading data.
            </p>
          </Section>

          <Divider />

          <Section id="section-11" title="11. Services Management">
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right, but not the obligation, to: monitor the Services for violations of these Terms; take appropriate legal action against anyone who violates these Terms; refuse, restrict access to, limit the availability of, or disable any of your Contributions; remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and otherwise manage the Services to protect our rights and property.
            </p>
          </Section>

          <Divider />

          <Section id="section-12" title="12. Privacy Policy">
            <p className="text-muted-foreground leading-relaxed">
              We care about data privacy and security. Please review our{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Terms. The Services are hosted in the United Arab Emirates and are subject to UAE data protection requirements.
            </p>
          </Section>

          <Divider />

          <Section id="section-13" title="13. Term and Termination">
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall remain in full force and effect while you use the Services. We reserve the right, in our sole discretion and without notice or liability, to deny access to and use of the Services (including blocking certain IP addresses) to any person for any reason, including breach of any representation, warranty, or covenant contained in these Terms. We may terminate your use or participation in the Services or delete your account at any time, without warning.
            </p>
          </Section>

          <Divider />

          <Section id="section-14" title="14. Modifications and Interruptions">
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems requiring maintenance resulting in interruptions or errors. We reserve the right to change, revise, update, suspend, or discontinue the Services at any time without notice.
            </p>
          </Section>

          <Divider />

          <Section id="section-15" title="15. Governing Law">
            <p className="text-muted-foreground leading-relaxed">
              These Terms and your use of the Services are governed by and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law principles. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.
            </p>
          </Section>

          <Divider />

          <Section id="section-16" title="16. Dispute Resolution">
            <p className="text-muted-foreground leading-relaxed">
              To expedite resolution and control the cost of any dispute, you and we agree to first attempt to negotiate any dispute informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one party to the other. If informal negotiations fail, the dispute shall be resolved by binding arbitration under the rules of the Dubai International Arbitration Centre (DIAC).
            </p>
          </Section>

          <Divider />

          <Section id="section-17" title="17. Disclaimer of Warranties">
            <p className="text-muted-foreground leading-relaxed uppercase text-xs tracking-wide">
              THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Nothing in the Services constitutes financial advice. Trading involves significant risk of loss. Past performance is not indicative of future results.
            </p>
          </Section>

          <Divider />

          <Section id="section-18" title="18. Limitations of Liability">
            <p className="text-muted-foreground leading-relaxed uppercase text-xs tracking-wide">
              TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </Section>

          <Divider />

          <Section id="section-19" title="19. Indemnification">
            <p className="text-muted-foreground leading-relaxed">
              You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable legal fees, made by any third party due to or arising out of: your Contributions; use of the Services; breach of these Terms; any breach of your representations and warranties herein; or your violation of the rights of a third party.
            </p>
          </Section>

          <Divider />

          <Section id="section-20" title="20. Contact Us">
            <p className="text-muted-foreground leading-relaxed">
              In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:
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
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-primary font-medium">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-20">
      {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
      {children}
    </section>
  )
}

function Divider() {
  return <hr className="border-border" />
}
