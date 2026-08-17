import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for required environment variables
  if (!process.env.CTRADER_AUTH_URL || !process.env.CTRADER_CLIENT_ID || !process.env.CTRADER_REDIRECT_URI) {
    console.error('[cTrader Auth] Missing environment variables:', {
      CTRADER_AUTH_URL: !!process.env.CTRADER_AUTH_URL,
      CTRADER_CLIENT_ID: !!process.env.CTRADER_CLIENT_ID,
      CTRADER_REDIRECT_URI: !!process.env.CTRADER_REDIRECT_URI,
    })
    return NextResponse.json(
      { error: 'cTrader integration not configured. Missing environment variables.' },
      { status: 500 }
    )
  }

  // Generate random state for CSRF protection
  const state = crypto.randomUUID()

  // Store state in a cookie — verified in the callback
  const response = NextResponse.redirect(
    `${process.env.CTRADER_AUTH_URL}?` +
    new URLSearchParams({
      client_id:     process.env.CTRADER_CLIENT_ID,
      redirect_uri:  process.env.CTRADER_REDIRECT_URI,
      response_type: 'code',
      scope:         'trading',
      state,
    }).toString()
  )

  response.cookies.set('ctrader_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  })

  return response
}
