import { createClient } from '@/lib/supabase/server'
import { createTrade, getUserTrades, normalizeTradeSource } from '@/lib/services/trade-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const data = await getUserTrades()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Fetch trades error:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[v0] API received trade data:', body)
    
    const {
      symbol,
      direction,
      entry_price,
      stop_loss,
      take_profit,
      exit_price,
      quantity,
      entry_time,
      close_time,
      exit_time,
      pnl,
      pnl_percent,
      r_multiple,
      risk_amount,
      notes,
      screenshots,
      screenshot_urls,
      strategy,
      setup_type,
      emotion_before,
      status,
      source,
      account_id,
      playbook_id,
      followed_rule_ids,
      followed_rules,
    } = body

    // Validate required fields
    if (!symbol || entry_price === undefined || !quantity) {
      console.error('[v0] Validation failed for trade:', { symbol, entry_price, quantity })
      return NextResponse.json({ 
        error: 'Missing required fields: symbol, entry_price, quantity' 
      }, { status: 400 })
    }

    // Normalize direction to long or short (database constraint)
    const directionInput = String(direction || 'buy').toLowerCase().trim()
    const normalizedDirection: 'long' | 'short' = (directionInput === 'buy' || directionInput === 'long') ? 'long' : 'short'

    // Validate and normalize source (defaults to 'manual' if not specified)
    let normalizedSource = 'manual'
    try {
      normalizedSource = normalizeTradeSource(source)
    } catch (err) {
      console.error('[v0] Invalid source value:', source)
      // Default to manual if validation fails, but log the error
      console.error('[v0] Source validation error:', err instanceof Error ? err.message : String(err))
    }

    const tradeData = {
      symbol: String(symbol).trim().toUpperCase(),
      direction: normalizedDirection,
      entry_price: parseFloat(String(entry_price)),
      exit_price: exit_price ? parseFloat(String(exit_price)) : null,
      stop_loss: stop_loss ? parseFloat(String(stop_loss)) : null,
      take_profit: take_profit ? parseFloat(String(take_profit)) : null,
      quantity: parseFloat(String(quantity)),
      entry_time: entry_time ? new Date(entry_time).toISOString() : new Date().toISOString(),
      exit_time: exit_time || close_time ? new Date(exit_time || close_time).toISOString() : new Date().toISOString(),
      pnl: pnl !== undefined ? parseFloat(String(pnl)) : 0,
      pnl_percent: pnl_percent !== undefined ? parseFloat(String(pnl_percent)) : 0,
      r_multiple: r_multiple ? parseFloat(String(r_multiple)) : null,
      risk_amount: risk_amount ? parseFloat(String(risk_amount)) : null,
      notes: notes || '',
      screenshots: screenshots || [],
      screenshot_urls: screenshot_urls || [],
      strategy: strategy || setup_type || '',
      setup_type: setup_type || strategy || '',
      status: 'closed',
      emotion_before: emotion_before || '',
      source: normalizedSource,
      account_id: account_id || null,
      playbook_id: playbook_id || null,
      followed_rule_ids: Array.isArray(followed_rule_ids) ? followed_rule_ids.filter((id: unknown): id is string => typeof id === 'string') : [],
      followed_rules: Array.isArray(followed_rules) ? followed_rules.filter((rule: unknown): rule is string => typeof rule === 'string').join('\n') : '',
    }

    console.log('[v0] Creating trade with data:', tradeData)
    const createdTrade = await createTrade(tradeData)
    
    return NextResponse.json(createdTrade, { status: 201 })
  } catch (error) {
    console.error('[v0] Create trade error:', error)
    return NextResponse.json({ 
      error: 'Failed to create trade',
      details: String(error)
    }, { status: 500 })
  }
}
