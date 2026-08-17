import { CTraderAccount, CTraderDeal, TokenResponse } from '@/types/ctrader'

const CTRADER_AUTH_URL = process.env.CTRADER_AUTH_URL || 'https://connect.spotware.com/apps/auth'
const CTRADER_TOKEN_URL = process.env.CTRADER_TOKEN_URL || 'https://connect.spotware.com/apps/token'
const CTRADER_API_BASE = process.env.CTRADER_API_BASE || 'https://api.spotware.com/connect'
const CTRADER_CLIENT_ID = process.env.CTRADER_CLIENT_ID
const CTRADER_CLIENT_SECRET = process.env.CTRADER_CLIENT_SECRET
const CTRADER_REDIRECT_URI = process.env.CTRADER_REDIRECT_URI

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CTRADER_CLIENT_ID || '',
    redirect_uri: CTRADER_REDIRECT_URI || '',
    response_type: 'code',
    scope: 'trading accounts',
    state,
  })
  return `${CTRADER_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const response = await fetch(CTRADER_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CTRADER_REDIRECT_URI || '',
      client_id: CTRADER_CLIENT_ID || '',
      client_secret: CTRADER_CLIENT_SECRET || '',
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[cTrader] Token exchange failed:', error)
    throw new Error('Failed to exchange code for tokens')
  }

  return response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(CTRADER_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CTRADER_CLIENT_ID || '',
      client_secret: CTRADER_CLIENT_SECRET || '',
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[cTrader] Token refresh failed:', error)
    throw new Error('Failed to refresh access token')
  }

  return response.json()
}

export async function fetchAccounts(accessToken: string): Promise<CTraderAccount[]> {
  const response = await fetch(`${CTRADER_API_BASE}/accounts`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[cTrader] Fetch accounts failed:', error)
    throw new Error('Failed to fetch accounts')
  }

  const data = await response.json()
  return data.accounts || []
}

export async function fetchDeals(
  accessToken: string,
  accountId: string,
  from: Date,
  to: Date
): Promise<CTraderDeal[]> {
  const fromMs = from.getTime()
  const toMs = to.getTime()

  const params = new URLSearchParams({
    from: fromMs.toString(),
    to: toMs.toString(),
    limit: '500',
  })

  const response = await fetch(
    `${CTRADER_API_BASE}/accounts/${accountId}/deals?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('[cTrader] Fetch deals failed:', error)
    throw new Error('Failed to fetch deals')
  }

  const data = await response.json()
  return data.deals || []
}

export function isTokenExpired(expiresAt: string): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt) < new Date()
}

export function mapDealToTrade(deal: CTraderDeal, userId: string) {
  const isClosed = !!deal.closePositionDetail
  const entryPrice =
    deal.closePositionDetail?.entryPrice || deal.executionPrice

  return {
    user_id: userId,
    symbol: deal.symbol.toUpperCase(),
    direction: deal.tradeSide === 'BUY' ? ('long' as const) : ('short' as const),
    lot_size: deal.volume / 100,
    quantity: deal.volume / 100,
    entry_price: entryPrice,
    exit_price: deal.closePositionDetail?.closePrice || null,
    entry_time: new Date(deal.createTimestamp).toISOString(),
    exit_time: new Date(deal.executionTimestamp).toISOString(),
    pnl: deal.closePositionDetail?.grossProfit || 0,
    commission: deal.commission || 0,
    swap: deal.swap || 0,
    status: isClosed ? ('closed' as const) : ('open' as const),
    strategy: deal.label || deal.comment || null,
    source: 'ctrader' as const,
    ctrader_position_id: deal.positionId,
    ctrader_deal_id: deal.dealId,
    raw_payload: deal as any,
  }
}
