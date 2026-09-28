import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const required = ["session_name", "routine_date", "mindset", "market_bias", "planned_setups", "risk_limits", "trading_rules"]
  if (required.some((key) => !String(body[key] ?? "").trim())) return NextResponse.json({ error: "Complete every field before saving." }, { status: 400 })

  const { data, error } = await supabase.from("premarket_routines").upsert({
    user_id: user.id,
    session_name: body.session_name,
    routine_date: body.routine_date,
    mindset: String(body.mindset).trim(),
    market_bias: String(body.market_bias).trim(),
    planned_setups: String(body.planned_setups).trim(),
    risk_limits: String(body.risk_limits).trim(),
    trading_rules: String(body.trading_rules).trim(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,session_name,routine_date" }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ routine: data })
}
