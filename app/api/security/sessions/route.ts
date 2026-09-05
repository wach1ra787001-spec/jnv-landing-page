import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/security/auth-guards"

export async function GET() {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_sessions")
    .select("id, device_name, browser, os, city, country, last_seen_at, logged_in_at, logged_out_at, is_current, session_id")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: "Unable to load sessions" }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function DELETE(request: NextRequest) {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null
  const allOther = body.allOther === true
  if (!sessionId && !allOther) return NextResponse.json({ error: "Session target is required" }, { status: 400 })

  let query = supabase
    .from("user_sessions")
    .update({ logged_out_at: new Date().toISOString(), is_current: false })
    .eq("user_id", user.id)
    .is("logged_out_at", null)

  if (sessionId) query = query.eq("id", sessionId).neq("is_current", true)
  if (allOther) query = query.neq("is_current", true)

  const { error } = await query
  if (error) return NextResponse.json({ error: "Unable to end session" }, { status: 500 })
  await supabase.from("security_events").insert({ user_id: user.id, event_type: allOther ? "sessions_revoked" : "session_revoked", user_agent: request.headers.get("user-agent") })
  return NextResponse.json({ ok: true })
}
