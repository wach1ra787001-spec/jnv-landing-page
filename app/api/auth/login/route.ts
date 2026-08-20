import { NextRequest, NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/rate-limit"
import { getAuthCookieOptions } from "@/lib/domain-routing"

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 2 * 60 * 60 * 1000

const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(MAX_ATTEMPTS, "2 h"),
  prefix: "jnv:auth:login",
  analytics: true,
})

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
}

function genericAuthError(message?: string | null) {
  if (!message) return "Unable to sign in. Please try again."
  const normalized = message.toLowerCase()
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email address before signing in."
  }
  if (normalized.includes("rate limit")) {
    return "Too many requests. Please wait and try again."
  }
  return "Invalid email or password."
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!email || !password || email.length > 320 || password.length > 1024) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 })
  }

  const identity = `${email}:${getClientIp(request)}`
  const preflight = await loginLimiter.getRemaining(identity)
  if (preflight.remaining <= 0) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 2 hours.", locked: true, attemptsRemaining: 0 },
      { status: 429 },
    )
  }

  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const cookieOptions = getAuthCookieOptions(requestHeaders.get("host")?.split(":")[0])
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          cookiesToSet.push(...cookies)
          cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    const result = await loginLimiter.limit(identity)
    const attemptsRemaining = Math.max(0, result.remaining)
    const locked = attemptsRemaining === 0
    const message = locked
      ? "Too many failed attempts. Try again in 2 hours."
      : attemptsRemaining <= 2
        ? `Invalid email or password. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left before a 2-hour lockout.`
        : genericAuthError(error?.message)

    return NextResponse.json({ error: message, locked, attemptsRemaining }, { status: locked ? 429 : 401 })
  }

  await redis.del(`jnv:auth:login:${identity}`)
  const response = NextResponse.json({ success: true, redirectTo: "/dashboard" })
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })
  return response
}

export const runtime = "nodejs"
export const maxDuration = 10
export { LOCKOUT_MS }
