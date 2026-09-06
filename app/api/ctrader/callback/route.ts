import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Check for required environment variables
  if (!process.env.CTRADER_TOKEN_URL || !process.env.CTRADER_API_BASE || !process.env.CTRADER_CLIENT_ID || !process.env.CTRADER_CLIENT_SECRET || !process.env.CTRADER_REDIRECT_URI) {
    console.error('[cTrader Callback] Missing environment variables')
    return NextResponse.redirect(
      new URL('/journal/connections?error=ctrader_not_configured', req.url)
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')


  // Handle user denying access
  if (error) {
    console.error('[cTrader Callback] User denied access:', error)
    return NextResponse.redirect(
      new URL('/journal/connections?error=access_denied', req.url)
    )
  }

  // Check if code is missing
  if (!code) {
    console.error('[cTrader Callback] Missing authorization code')
    return NextResponse.redirect(
      new URL('/journal/connections?error=missing_code', req.url)
    )
  }

  // Verify CSRF state
  const storedState = req.cookies.get('ctrader_oauth_state')?.value
  
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL('/journal/connections?error=invalid_state', req.url)
    )
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(process.env.CTRADER_TOKEN_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code:          code,
        redirect_uri:  process.env.CTRADER_REDIRECT_URI!,
        client_id:     process.env.CTRADER_CLIENT_ID!,
        client_secret: process.env.CTRADER_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      console.error('[cTrader Callback] Token exchange failed:')
      console.error('Status:', tokenRes.status)
      console.error('Response:', errorText)
      return NextResponse.redirect(
        new URL('/journal/connections?error=token_failed', req.url)
      )
    }

    const tokenData = await tokenRes.json()
    const { access_token, refresh_token, expires_in } = tokenData
    console.log('[cTrader Callback] Tokens received, expires_in:', expires_in)

    // Fetch cTrader accounts using oauth_token as query parameter
    console.log('[cTrader Callback] Fetching accounts...')
    
    const accountsRes = await fetch(
      `https://api.spotware.com/connect/tradingaccounts?oauth_token=${access_token}`
    )

    console.log('[cTrader Callback] Accounts status:', accountsRes.status)
    const accountsRaw = await accountsRes.text()
    console.log('[cTrader Callback] Accounts raw response:', accountsRaw)

    if (!accountsRes.ok) {
      console.error('[cTrader Callback] Accounts fetch failed:', accountsRaw)
      return NextResponse.redirect(
        new URL('/journal/connections?error=accounts_failed', req.url)
      )
    }

    const accountsData = JSON.parse(accountsRaw)
    console.log('[cTrader Callback] Accounts parsed:', JSON.stringify(accountsData, null, 2))
    
    // cTrader returns accounts under data key
    const accounts = accountsData.data ?? []

    if (!Array.isArray(accounts) || accounts.length === 0) {
      console.error('[cTrader Callback] No accounts found in response. Available keys:', Object.keys(accountsData))
      return NextResponse.redirect(
        new URL('/journal/connections?error=no_accounts', req.url)
      )
    }

    // Use first account
    const account = accounts[0]
    console.log('[cTrader Callback] Using account:', JSON.stringify(account, null, 2))

    // Extract account details - cTrader returns accountId, not ctidTraderAccountId
    // Try accountId first, then fallback to other possible names
    const accountId = account.accountId ?? account.ctidTraderAccountId ?? account.id
    const accountLogin = account.traderLogin ?? account.login ?? account.loginId
    const accountName = account.brokerName ?? account.name ?? account.accountName
    const brokerName = account.brokerName ?? account.broker
    const isLive = account.isLive ?? account.live ?? false

    if (!accountId) {
      console.error('[cTrader Callback] Account missing ID. Account object:', account)
      console.error('[cTrader Callback] Available fields:', Object.keys(account))
      return NextResponse.redirect(
        new URL('/journal/connections?error=no_accounts', req.url)
      )
    }

    console.log('[cTrader Callback] Extracted account data:', { accountId, accountLogin, accountName, brokerName, isLive })

    // Save connection to DB
    // Set sync_from_date to 30 days ago to limit initial import to ~50 trades
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            .toISOString().split('T')[0]
    
    console.log('[cTrader Callback] Saving connection to database...')
    const { error: dbError } = await supabase.from('broker_connections').upsert({
      user_id:            user.id,
      broker:             'ctrader',
      access_token,
      refresh_token,
      token_expires_at:   new Date(Date.now() + expires_in * 1000).toISOString(),
      ctrader_account_id: accountId,
      account_login:      accountLogin,
      account_name:       accountName,
      broker_name:        brokerName,
      is_live:            isLive,
      is_connected:       true,
      sync_from_date:     thirtyDaysAgo,
    }, {
      onConflict: 'user_id, broker, ctrader_account_id'
    })

    if (dbError) {
      console.error('[cTrader Callback] Database error:', dbError)
      return NextResponse.redirect(
        new URL('/journal/connections?error=db_error', req.url)
      )
    }

    console.log('[cTrader Callback] Connection saved successfully')

    // Trigger initial sync
    console.log('[cTrader Callback] Triggering initial sync...')
    await fetch(new URL('/api/ctrader/sync', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })

    // Clear state cookie and redirect
    const response = NextResponse.redirect(
      new URL('/journal/connections?connected=true', req.url)
    )
    response.cookies.delete('ctrader_oauth_state')
    console.log('[cTrader Callback] Redirecting to success page')
    return response
  } catch (err) {
    console.error('[cTrader Callback] Unexpected error:', err instanceof Error ? err.message : err)
    return NextResponse.redirect(
      new URL('/journal/connections?error=unexpected', req.url)
    )
  }
}
