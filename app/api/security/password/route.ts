import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""
  if (newPassword.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  if (newPassword !== body.confirmPassword) return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })

  const verification = await supabase.auth.signInWithPassword({ email: auth.user.email, password: currentPassword })
  if (verification.error) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return NextResponse.json({ error: "Unable to update password" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
