import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const url = new URL(request.url)
  const tradeId = url.searchParams.get("trade_id")
  let query = supabase.from("premarket_trade_links").select("routine_id, premarket_routines(*)").eq("trade_id", tradeId || "")
  const { data, error } = await query.maybeSingle()
  if (error) { console.error('[v0] Premarket routine database error:', error); return NextResponse.json({ error: 'Failed to save pre-market routine. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ routine: data?.premarket_routines || null })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const required = ["session_name", "trading_date", "market_bias", "mentally_ready"]
  if (required.some((key) => body[key] === undefined || body[key] === null || String(body[key]).trim() === "")) return NextResponse.json({ error: "Complete the required fields before saving." }, { status: 400 })
  const { link_type: _linkType, trade_id: _tradeId, today_trade_ids: _todayTradeIds, routine_id: _routineId, screenshot_urls: _screenshotUrls, ...routineFields } = body

  if (_routineId && _tradeId) {
    const { data: routine } = await supabase.from("premarket_routines").select("id").eq("id", _routineId).eq("user_id", user.id).maybeSingle()
    if (!routine) return NextResponse.json({ error: "Premarket routine not found" }, { status: 404 })
    const { error: linkError } = await supabase.from("premarket_trade_links").upsert({ routine_id: _routineId, trade_id: _tradeId }, { onConflict: "routine_id,trade_id" })
    if (linkError) return NextResponse.json({ error: "Could not link the premarket routine to this trade" }, { status: 500 })
    return NextResponse.json({ routine_id: _routineId, linked_trade_count: 1 })
  }
  const numericFields = [
    "sleep_duration",
    "energy_level",
    "stress_level",
    "focus_level",
    "max_trades_planned",
    "risk_per_trade",
    "max_daily_loss",
    "max_trades_after_loss",
    "minimum_rr",
  ] as const
  for (const field of numericFields) {
    const value = routineFields[field]
    if (typeof value === "string") {
      const cleaned = value.replace(/%/g, "").trim()
      routineFields[field] = cleaned === "" ? null : Number(cleaned)
    }
  }
  const payload = {
    ...routineFields,
    user_id: user.id,
    routine_date: body.trading_date,
    trading_date: body.trading_date,
    mindset: body.mood || body.mindset || "neutral",
    market_bias: body.market_bias || body.higher_timeframe_bias || "Not specified",
    planned_setups: body.planned_setups || body.setup_strategy || "Not specified",
    risk_limits: body.risk_limits || [body.risk_per_trade, body.max_daily_loss].filter(Boolean).join(" / ") || "Not specified",
    trading_rules: body.trading_rules || body.entry_criteria || "Not specified",
    screenshot_urls: Array.isArray(_screenshotUrls) ? _screenshotUrls.slice(0, 2) : [],
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from("premarket_routines").upsert(payload, { onConflict: "user_id,session_name,routine_date" }).select().single()
  if (error) { console.error('[v0] Premarket routine database error:', error); return NextResponse.json({ error: 'Failed to save pre-market routine. Please try again.' }, { status: 500 }) }
  const linkType = body.link_type
  const tradeIds = linkType === "trade" && body.trade_id ? [body.trade_id] : linkType === "today" && Array.isArray(body.today_trade_ids) ? body.today_trade_ids : []
  if (tradeIds.length) {
    const { error: linkError } = await supabase.from("premarket_trade_links").upsert(tradeIds.map((trade_id: string) => ({ routine_id: data.id, trade_id })), { onConflict: "routine_id,trade_id" })
    if (linkError) {
    console.error('[v0] Premarket trade link error:', linkError)
    return NextResponse.json({ error: 'The routine was saved, but it could not be linked to that trade. Please try linking it again.' }, { status: 500 })
  }
  }
  return NextResponse.json({ routine: data, linked_trade_count: tradeIds.length })
}
