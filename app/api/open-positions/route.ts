import { createClient } from '@/lib/supabase/server'
import { getSelectedAccountId } from '@/lib/get-selected-account'
import { decryptTradeLockerToken } from '@/lib/tradelocker-crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prefer an explicit accountId query param (threaded down from the
    // caller's already-resolved active account) and fall back to resolving
    // it server-side so the route still works when called without one.
    const requestedAccountId = request.nextUrl.searchParams.get('accountId')
    const accountId = requestedAccountId || (await getSelectedAccountId(supabase, user.id))

    if (!accountId) return NextResponse.json([])

    const { data: account } = await supabase
      .from('accounts')
      .select('id, broker_connection_id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!account?.broker_connection_id) return NextResponse.json([])

    const { data: connection } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('id', account.broker_connection_id)
      .eq('user_id', user.id)
      .eq('broker', 'tradelocker')
      .eq('is_connected', true)
      .maybeSingle()

    if (!connection?.encrypted_access_token || !connection.tradelocker_account_id) return NextResponse.json([])

    const apiBase = process.env.TRADELOCKER_API_BASE || 'https://live.tradelocker.com/backend-api'
    const accessToken = decryptTradeLockerToken(connection.encrypted_access_token)
    const response = await fetch(`${apiBase}/trade/accounts/${connection.tradelocker_account_id}/positions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accNum: String(connection.account_login || connection.tradelocker_account_id),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) return NextResponse.json({ error: payload?.message || `TradeLocker API error (${response.status})` }, { status: 502 })

    const rows = payload?.positions || payload?.data || []
    const positions = rows.map((position: any, index: number) => {
      const direction = String(position.side ?? position.direction ?? '').toLowerCase().includes('sell') ? 'short' : 'long'
      const pnl = Number(position.profit ?? position.pnl ?? position.floatingPnl ?? 0)
      return {
        id: String(position.positionId ?? position.id ?? `${connection.tradelocker_account_id}-${index}`),
        account_id: account.id,
        symbol: String(position.symbol ?? position.instrument ?? 'UNKNOWN').toUpperCase(),
        direction,
        volume: Number(position.quantity ?? position.volume ?? 0),
        entry_price: Number(position.openPrice ?? position.entryPrice ?? position.price ?? 0),
        current_price: Number(position.currentPrice ?? position.marketPrice ?? position.closePrice ?? 0) || null,
        net_floating_pnl: pnl,
        stop_loss: Number(position.stopLoss ?? position.sl ?? 0) || null,
        take_profit: Number(position.takeProfit ?? position.tp ?? 0) || null,
        opened_at: position.openTime ?? position.openedAt ?? position.createTime ?? new Date().toISOString(),
        time_open_display: position.openTime ?? position.openedAt ?? position.createTime ?? '—',
        is_in_profit: pnl >= 0,
      }
    })

    return NextResponse.json(positions)
  } catch (error) {
    console.error('[v0] Error in open positions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
