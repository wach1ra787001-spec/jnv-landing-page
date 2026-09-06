import { NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/security/auth-guards"

export async function GET() {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("security_events")
    .select("id, event_type, ip_address, user_agent, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) return NextResponse.json({ error: "Unable to load security activity" }, { status: 500 })
  return NextResponse.json(data ?? [])
}
