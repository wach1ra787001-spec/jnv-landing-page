import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/security/auth-guards"

export async function POST(request: NextRequest) {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.sessionId === "string" && body.sessionId.length <= 128 ? body.sessionId : null
  if (!sessionId) return NextResponse.json({ error: "Session identifier is required" }, { status: 400 })

  const details = {
    device_name: typeof body.deviceName === "string" ? body.deviceName.slice(0, 100) : "Unknown device",
    browser: typeof body.browser === "string" ? body.browser.slice(0, 100) : null,
    os: typeof body.os === "string" ? body.os.slice(0, 100) : null,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    is_current: true,
    last_seen_at: new Date().toISOString(),
    logged_out_at: null,
  }

  await supabase
    .from("user_sessions")
    .update({ is_current: false })
    .eq("user_id", user.id)
    .neq("session_id", sessionId)
    .is("logged_out_at", null)

  const { data: existing } = await supabase
    .from("user_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .maybeSingle()

  const query = existing
    ? supabase.from("user_sessions").update(details).eq("id", existing.id).eq("user_id", user.id)
    : supabase.from("user_sessions").insert({ user_id: user.id, session_id: sessionId, ...details })
  const { error } = await query

  if (error) return NextResponse.json({ error: "Unable to register session" }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const currentSessionId = request.nextUrl.searchParams.get("sessionId")
  if (currentSessionId) {
    const { data: currentSession, error } = await supabase
      .from("user_sessions")
      .select("logged_out_at")
      .eq("user_id", user.id)
      .eq("session_id", currentSessionId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: "Unable to check session" }, { status: 500 })
    return NextResponse.json({ ended: Boolean(currentSession?.logged_out_at) })
  }

  const { data, error } = await supabase
    .from("user_sessions")
    .select("id, device_name, browser, os, city, country, last_seen_at, logged_in_at, logged_out_at, is_current, session_id, user_agent")
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
