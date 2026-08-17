import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logCTraderEvent, formatCTraderErrorResponse, CTraderIntegrationError, CTraderErrorCode } from '@/lib/ctrader-errors'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    logCTraderEvent('sync_unauthorized', {}, 'warn')
    return NextResponse.json(
      formatCTraderErrorResponse(new CTraderIntegrationError(CTraderErrorCode.UNAUTHORIZED, 'User not authenticated')),
      { status: 401 }
    )
  }

  // Get connection details
  const { data: connection, error: connError } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('broker', 'ctrader')
    .eq('is_connected', true)
    .single()

  if (connError || !connection) {
    logCTraderEvent('sync_no_connection', { userId: user.id, error: connError?.message }, 'warn')
    return NextResponse.json(
      formatCTraderErrorResponse(new CTraderIntegrationError(CTraderErrorCode.NOT_CONNECTED, 'No active cTrader connection')),
      { status: 404 }
    )
  }

  try {
    // Refresh token if expired
    let accessToken = connection.access_token
    const tokenExpiry = new Date(connection.token_expires_at)
    const now = new Date()

    if (tokenExpiry <= now) {
      logCTraderEvent('token_refresh_needed', { connectionId: connection.id, expiresAt: connection.token_expires_at }, 'info')

      const refreshRes = await fetch(process.env.CTRADER_TOKEN_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'refresh_token',
          refresh_token: connection.refresh_token,
          client_id:     process.env.CTRADER_CLIENT_ID!,
          client_secret: process.env.CTRADER_CLIENT_SECRET!,
        }),
      })

      if (!refreshRes.ok) {
        const refreshError = await refreshRes.text()
        logCTraderEvent('token_refresh_failed', { connectionId: connection.id, error: refreshError }, 'error')

        await supabase.from('broker_connections')
          .update({ is_connected: false, last_sync_error: 'Token refresh failed' })
          .eq('id', connection.id)

        return NextResponse.json(
          formatCTraderErrorResponse(new CTraderIntegrationError(CTraderErrorCode.TOKEN_REFRESH_FAILED, 'Failed to refresh access token')),
          { status: 401 }
        )
      }

      const tokens = await refreshRes.json()
      accessToken = tokens.access_token

      await supabase.from('broker_connections').update({
        access_token:      tokens.access_token,
        refresh_token:     tokens.refresh_token,
        token_expires_at:  new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }).eq('id', connection.id)

      logCTraderEvent('token_refreshed', { connectionId: connection.id }, 'info')
    }

    // Fetch deals from cTrader
    const from = connection.last_synced_at
      ? new Date(connection.last_synced_at).getTime()
      : new Date(connection.sync_from_date).getTime()

    logCTraderEvent('fetching_deals', { connectionId: connection.id, from, to: Date.now(), accountId: connection.ctrader_account_id }, 'info')

    // Validate account ID
    if (!connection.ctrader_account_id) {
      console.error('[Sync] ctrader_account_id is null or undefined for connection:', connection.id)
      logCTraderEvent('sync_missing_account_id', { connectionId: connection.id }, 'error')
      return NextResponse.json(
        formatCTraderErrorResponse(new CTraderIntegrationError(CTraderErrorCode.SYNC_FAILED, 'No cTrader account ID stored. Please reconnect your account.')),
        { status: 400 }
      )
    }

    // Test multiple Open API endpoint variations for trade history
    // cTrader's Open API is on openapi.ctrader.com, not api.spotware.com
    const endpointVariations = [
      `https://openapi.ctrader.com/tradingaccounts/${connection.ctrader_account_id}/deals`,
      `https://openapi.ctrader.com/accounts/${connection.ctrader_account_id}/deals`,
      `https://api.spotware.com/openapi/tradingaccounts/${connection.ctrader_account_id}/deals`,
      `https://api.spotware.com/v2/tradingaccounts/${connection.ctrader_account_id}/deals`,
    ]

    let correctEndpoint: string | null = null
    let lastStatusCode: number | null = null

    for (const endpoint of endpointVariations) {
      const testUrl = `${endpoint}?oauth_token=${accessToken}&limit=1`
      console.log('[Sync] Testing endpoint:', endpoint)
      
      try {
        const testRes = await fetch(testUrl, { signal: AbortSignal.timeout(10000) })
        console.log(`[Sync] ${endpoint} → Status ${testRes.status}`)
        lastStatusCode = testRes.status
        
        if (testRes.ok) {
          correctEndpoint = endpoint
          console.log('[Sync] Found working endpoint:', correctEndpoint)
          break
        }
      } catch (e: any) {
        console.log(`[Sync] ${endpoint} → Error: ${e.message}`)
      }
    }

    if (!correctEndpoint) {
      console.error('[Sync] Could not find working endpoint. Tried all variations. Last status:', lastStatusCode)
      logCTraderEvent('endpoint_discovery_failed', { accountId: connection.ctrader_account_id, lastStatus: lastStatusCode }, 'error')
      
      await supabase.from('broker_connections')
        .update({ last_sync_error: `Could not access deals endpoint. Status: ${lastStatusCode}. Verify app permissions at connect.spotware.com/apps` })
        .eq('id', connection.id)

      return NextResponse.json(
        formatCTraderErrorResponse(new CTraderIntegrationError(CTraderErrorCode.SYNC_FAILED, 'Could not access cTrader deals endpoint. Check app permissions.')),
        { status: 500 }
      )
    }

    // Build deals URL with discovered endpoint
    const dealsUrl = `${correctEndpoint}?` +
      new URLSearchParams({
        from:        from.toString(),
        to:          Date.now().toString(),
        limit:       '50',
        oauth_token: accessToken,
      }).toString()

    console.log('[Sync] Using endpoint:', correctEndpoint)
    console.log('[Sync] Fetching deals from:', dealsUrl)

    const dealsRes = await fetch(dealsUrl, {
      signal: AbortSignal.timeout(30000)
    })

    if (!dealsRes.ok) {
      const errText = await dealsRes.text()
      console.error('[Sync] Deals fetch failed with status', dealsRes.status)
      console.error('[Sync] Failed URL:', dealsUrl)
      console.error('[Sync] Response:', errText)
      logCTraderEvent('deals_fetch_failed', { 
        connectionId: connection.id, 
        status: dealsRes.status, 
        url: dealsUrl,
        accountId: connection.ctrader_account_id,
        error: errText.substring(0, 200)
      }, 'error')

      await supabase.from('broker_connections')
        .update({ last_sync_error: `HTTP ${dealsRes.status}: ${errText.substring(0, 100)}` })
        .eq('id', connection.id)

      return NextResponse.json(
        formatCTraderErrorResponse(new CTraderIntegrationError(CTraderErrorCode.SYNC_FAILED, 'Failed to fetch deals from cTrader')),
        { status: 500 }
      )
    }

    const dealsData = await dealsRes.json()
    console.log('[Sync] Raw deals response:', JSON.stringify(dealsData).substring(0, 500))
    
    // cTrader returns deals under data key
    const deals = dealsData.data ?? dealsData.deals ?? []

    if (!deals?.length) {
      logCTraderEvent('no_deals_to_import', { connectionId: connection.id }, 'info')

      await supabase.from('broker_connections')
        .update({ last_synced_at: new Date().toISOString(), last_sync_error: null })
        .eq('id', connection.id)

      return NextResponse.json({ imported: 0, message: 'No new deals to import' })
    }

    logCTraderEvent('deals_fetched', { connectionId: connection.id, count: deals.length }, 'info')

    // Map cTrader deals to our trades schema
    const mappedTrades = deals.map((deal: any) => ({
      user_id:              user.id,
      source:               'ctrader',
      ctrader_position_id:  deal.positionId,
      ctrader_deal_id:      deal.dealId,
      symbol:               deal.symbol.toUpperCase(),
      direction:            deal.tradeSide === 'BUY' ? 'long' : 'short',
      lot_size:             deal.volume / 100,
      quantity:             deal.volume / 100,
      entry_price:          deal.closePositionDetail?.entryPrice ?? deal.executionPrice,
      exit_price:           deal.closePositionDetail?.closePrice ?? null,
      entry_time:           new Date(deal.createTimestamp).toISOString(),
      exit_time:            deal.closePositionDetail
                              ? new Date(deal.executionTimestamp).toISOString()
                              : null,
      status:               deal.closePositionDetail ? 'closed' : 'open',
      pnl:                  deal.closePositionDetail?.grossProfit ?? null,
      commission:           deal.commission ?? 0,
      swap:                 deal.swap ?? 0,
      strategy:             deal.label || deal.comment || null,
      raw_payload:          deal,
    }))

    // Upsert — safe to run multiple times
    const { error: upsertError } = await supabase
      .from('trades')
      .upsert(mappedTrades, {
        onConflict: 'user_id, ctrader_position_id',
      })

    if (upsertError) {
      logCTraderEvent('upsert_failed', { connectionId: connection.id, error: upsertError.message }, 'error')

      await supabase.from('broker_connections')
        .update({ last_sync_error: upsertError.message })
        .eq('id', connection.id)

      return NextResponse.json(
        formatCTraderErrorResponse(new CTraderIntegrationError(CTraderErrorCode.SYNC_FAILED, 'Failed to save trades to database')),
        { status: 500 }
      )
    }

    // Update sync timestamp
    await supabase.from('broker_connections')
      .update({
        last_synced_at:  new Date().toISOString(),
        last_sync_error: null,
      })
      .eq('id', connection.id)

    logCTraderEvent('sync_completed', { connectionId: connection.id, imported: mappedTrades.length }, 'info')

    return NextResponse.json({ imported: mappedTrades.length, message: 'Sync completed successfully' })
  } catch (error: any) {
    console.error('[Sync] Unexpected error during sync')
    console.error('[Sync] Error name:', error?.name)
    console.error('[Sync] Error message:', error?.message)
    console.error('[Sync] Error cause:', error?.cause)
    console.error('[Sync] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    logCTraderEvent('sync_unexpected_error', { 
      userId: user.id, 
      error: error instanceof Error ? error.message : 'Unknown',
      errorName: error?.name,
      errorCause: error?.cause?.message
    }, 'error')

    return NextResponse.json(
      formatCTraderErrorResponse(error),
      { status: 500 }
    )
  }
}
