import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface TradeImportEmailParams {
  userEmail: string
  userName: string
  symbol: string
  direction: 'buy' | 'sell'
  entryPrice: number
  tradeDate: string
  tradeId: string
}

/**
 * Send trade imported email via Resend
 */
export async function sendTradeImportedEmail({
  userEmail,
  userName,
  symbol,
  direction,
  entryPrice,
  tradeDate,
  tradeId,
}: TradeImportEmailParams) {
  try {
    // Ensure email is configured
    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('[Email] RESEND_FROM_EMAIL not configured')
      throw new Error('Email service not configured')
    }

    const journalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://jnvpro.com'}/dashboard/trade-detail/${tradeId}`

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Trade Ready to Journal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1a202c;
      margin-bottom: 20px;
    }
    .trade-info {
      background-color: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .trade-info p {
      margin: 8px 0;
      font-size: 14px;
    }
    .trade-info strong {
      color: #2d3748;
    }
    .cta-section {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 6px;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .description {
      color: #4a5568;
      font-size: 14px;
      line-height: 1.8;
      margin: 20px 0;
    }
    .footer {
      background-color: #f7fafc;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #718096;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>JNV Pro</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #1a202c; margin-top: 0;">A New Trade Is Waiting</h2>
      
      <div class="greeting">Hi ${userName},</div>
      
      <p class="description">
        Your <strong>${symbol}</strong> trade has just been imported into your trading journal.
      </p>
      
      <p class="description">
        The best traders document every trade while the reasoning, emotions, and execution are still fresh. Take a few minutes to complete your journal entry before moving on to your next setup.
      </p>
      
      <div class="trade-info">
        <p><strong>Symbol:</strong> ${symbol}</p>
        <p><strong>Direction:</strong> ${direction.toUpperCase()}</p>
        <p><strong>Entry Price:</strong> ${entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        <p><strong>Trade Date:</strong> ${tradeDate}</p>
      </div>
      
      <div class="cta-section">
        <a href="${journalUrl}" class="button">Journal Trade</a>
      </div>
      
      <p class="description">
        If you have any questions or need assistance, please don't hesitate to reach out to our support team.
      </p>
    </div>
    
    <div class="footer">
      <p>Every documented trade is another opportunity to improve your consistency.</p>
      <p>— JNV Pro</p>
    </div>
  </div>
</body>
</html>
    `

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: userEmail,
      subject: `New ${symbol} Trade Ready to Journal`,
      html: emailHtml,
    })

    if (response.error) {
      console.error('[Email] Resend error:', response.error)
      throw new Error(response.error.message)
    }

    console.log(`[Email] Trade imported email sent successfully to ${userEmail} (${symbol})`)
    return { success: true, messageId: response.data?.id }
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    throw error
  }
}

/**
 * Test email to verify Resend configuration
 */
export async function sendLossStreakWarningEmail({ userEmail, userName, streakLength }: { userEmail: string; userName?: string | null; streakLength: number }) {
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim()
  const senderEmail = configuredFrom?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  if (!senderEmail) throw new Error('Email service misconfigured: RESEND_FROM_EMAIL must contain a verified email address, for example JNV AI <notifications@your-domain.com>')
  const from = configuredFrom?.includes('<') ? configuredFrom : `jnv AI <${senderEmail}>`
  const greeting = userName?.trim() ? `Hi ${userName.trim()},` : 'Hi there,'
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;line-height:1.65;color:#202124"><h2>Protect your process</h2><p>${greeting}</p><p>You have lost ${streakLength} trades in a row and your consistency is below 50%. You are not following your trading model consistently.</p><p>This is not the time to force another trade.</p><p>Step away. Review the two trades. Identify which rule you broke and why.</p><p>Your edge comes from executing your system consistently, not from trying to win back losses.</p><p>Before your next trade, review your rules and make sure you&apos;re actually following them.</p><p>Protect the process. The results follow.</p><p>— jnv AI</p></div>`
  const response = await resend.emails.send({ from, to: userEmail, subject: `Trading warning: ${streakLength}-trade losing streak`, html })
  if (response.error) throw new Error(response.error.message)
  return { success: true, messageId: response.data?.id }
}

export async function sendTestEmail(email: string) {
  try {
    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error('Email service not configured (RESEND_FROM_EMAIL)')
    }

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'JNV Pro - Test Email',
      html: `
<h1>Test Email</h1>
<p>This is a test email from JNV Pro. If you received this, your email configuration is working correctly.</p>
      `,
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return { success: true, messageId: response.data?.id }
  } catch (error) {
    console.error('[Email] Test email failed:', error)
    throw error
  }
}
