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
  if (error) { console.error('[v0] Premarket routine database error:', error); return NextResponse.json({ error: 'Failed to save trade. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ routine: data?.premarket_routines || null })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const required = ["session_name", "trading_date", "market_bias", "mentally_ready"]
  if (required.some((key) => body[key] === undefined || body[key] === null || String(body[key]).trim() === "")) return NextResponse.json({ error: "Complete the required fields before saving." }, { status: 400 })
  const payload = { ...body, user_id: user.id, routine_date: body.trading_date, trading_date: body.trading_date, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from("premarket_routines").upsert(payload, { onConflict: "user_id,session_name,routine_date" }).select().single()
  if (error) { console.error('[v0] Premarket routine database error:', error); return NextResponse.json({ error: 'Failed to save trade. Please try again.' }, { status: 500 }) }
  const linkType = body.link_type
  const tradeIds = linkType === "trade" && body.trade_id ? [body.trade_id] : linkType === "today" && Array.isArray(body.today_trade_ids) ? body.today_trade_ids : []
  if (tradeIds.length) {
    const { error: linkError } = await supabase.from("premarket_trade_links").upsert(tradeIds.map((trade_id: string) => ({ routine_id: data.id, trade_id })), { onConflict: "routine_id,trade_id" })
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })
  }
  return NextResponse.json({ routine: data, linked_trade_count: tradeIds.length })
}
