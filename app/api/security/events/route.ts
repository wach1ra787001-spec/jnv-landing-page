import { NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/security/auth-guards"

export async function GET() {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: events, error } = await supabase
    .from("security_events")
    .select("id, event_type, ip_address, user_agent, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) return NextResponse.json({ error: "Unable to load security activity" }, { status: 500 })

  const userAgents = [...new Set((events ?? []).map((event) => event.user_agent).filter(Boolean))]
  const { data: sessions } = userAgents.length
    ? await supabase
        .from("user_sessions")
        .select("device_name, browser, os, city, country, user_agent")
        .eq("user_id", user.id)
        .in("user_agent", userAgents)
    : { data: [] }

  const sessionByAgent = new Map((sessions ?? []).map((session) => [session.user_agent, session]))
  return NextResponse.json(
    (events ?? []).map((event) => ({
      ...event,
      session: event.user_agent ? sessionByAgent.get(event.user_agent) ?? null : null,
    })),
  )
}
