import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/security/auth-guards"

export async function POST(request: NextRequest) {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user?.email) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""
  if (newPassword.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  if (newPassword !== body.confirmPassword) return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })

  const verification = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
  if (verification.error) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return NextResponse.json({ error: "Unable to update password" }, { status: 400 })
  await supabase.from("security_events").insert({ user_id: user.id, event_type: "password_changed", user_agent: request.headers.get("user-agent") })
  return NextResponse.json({ ok: true })
}
