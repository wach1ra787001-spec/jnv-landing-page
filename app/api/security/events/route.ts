import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("security_events")
    .select("id, event_type, ip_address, user_agent, metadata, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) return NextResponse.json({ error: "Unable to load security activity" }, { status: 500 })
  return NextResponse.json(data ?? [])
}
