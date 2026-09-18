import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ParsedTrade } from '@/lib/csv-import/parser'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let trades: ParsedTrade[]
  try {
    const body = await req.json()
    trades = body.trades
    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: 'No trades provided' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ── Fetch existing external_refs and position IDs to detect duplicates ──────
  const externalRefs = trades
    .map(t => t.external_ref)
    .filter((r): r is string => !!r)

  let existingRefs = new Set<string>()
  if (externalRefs.length > 0) {
    const { data: existing } = await supabase
      .from('trades')
      .select('external_ref')
      .eq('user_id', user.id)
      .in('external_ref', externalRefs)
    existing?.forEach(r => { if (r.external_ref) existingRefs.add(r.external_ref) })
  }

  // For trades without external_ref, build a fallback dedup key: symbol+open_time+lot_size
  const fallbackKeys = trades
    .filter(t => !t.external_ref)
    .map(t => `${t.symbol}|${t.open_time}|${t.lot_size}`)

  let existingFallbackKeys = new Set<string>()
  if (fallbackKeys.length > 0) {
    // Fetch recent trades for this user to compare
    const { data: recentTrades } = await supabase
      .from('trades')
      .select('symbol, entry_time, lot_size')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2000)

    recentTrades?.forEach(r => {
      if (r.entry_time) {
        existingFallbackKeys.add(`${r.symbol}|${r.entry_time}|${r.lot_size}`)
      }
    })
  }

  // ── Build insert rows ─────────────────────────────────────────────────────
  const toInsert: any[] = []
  let duplicates = 0

  for (const trade of trades) {
    // Check duplicate by external_ref
    if (trade.external_ref && existingRefs.has(trade.external_ref)) {
      duplicates++
      continue
    }
    // Check fallback duplicate key
    if (!trade.external_ref) {
      const key = `${trade.symbol}|${trade.open_time}|${trade.lot_size}`
      if (existingFallbackKeys.has(key)) {
        duplicates++
        continue
      }
    }

    toInsert.push({
      user_id:      user.id,
      source:       'csv',
      symbol:       trade.symbol,
      direction:    trade.direction,
      entry_price:  trade.entry_price,
      exit_price:   trade.exit_price,
      lot_size:     trade.lot_size,
      quantity:     trade.quantity,
      entry_time:   trade.open_time,
      exit_time:    trade.close_time,
      pnl:          trade.pnl,
      net_pnl:      trade.net_pnl,
      commission:   trade.commission,
      swap:         trade.swap,
      stop_loss:    trade.stop_loss,
      take_profit:  trade.take_profit,
      external_ref: trade.external_ref,
      status:       trade.status,
      raw_payload:  trade.raw,
    })
  }

  if (toInsert.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: 0,
      duplicates,
      message: 'All trades are duplicates — nothing new was imported.',
    })
  }

  const { data: savedImports, error: importError } = await supabase
    .from('csv_imports')
    .upsert(toInsert, { onConflict: 'user_id,source,external_ref', ignoreDuplicates: true })
    .select('id, symbol, direction, entry_price, exit_price, lot_size, quantity, entry_time, exit_time, pnl, net_pnl, commission, swap, external_ref, status, raw_payload, source')

  if (importError) {
    console.error('[v0] Failed to persist pending CSV imports:', importError)
    return NextResponse.json({ error: 'Could not save imported trades for journaling' }, { status: 500 })
  }

  return NextResponse.json({
    imported: savedImports?.length ?? 0,
    skipped: 0,
    duplicates,
    trades: savedImports ?? [],
    message: `${savedImports?.length ?? 0} trades ready to be logged`,
  })
}
