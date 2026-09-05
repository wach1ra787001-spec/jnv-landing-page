import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_sessions")
    .select("id, device_name, browser, os, city, country, last_seen_at, logged_in_at, logged_out_at, is_current, session_id")
    .eq("user_id", auth.user.id)
    .order("last_seen_at", { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: "Unable to load sessions" }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null
  const allOther = body.allOther === true
  if (!sessionId && !allOther) return NextResponse.json({ error: "Session target is required" }, { status: 400 })

  let query = supabase
    .from("user_sessions")
    .update({ logged_out_at: new Date().toISOString(), is_current: false })
    .eq("user_id", auth.user.id)
    .is("logged_out_at", null)

  if (sessionId) query = query.eq("id", sessionId).neq("session_id", auth.user.id)
  if (allOther) query = query.neq("session_id", auth.user.id)

  const { error } = await query
  if (error) return NextResponse.json({ error: "Unable to end session" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
