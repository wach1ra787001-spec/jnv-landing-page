import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { supabase, user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { supabase, user: data.user, response: null }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 })
}
