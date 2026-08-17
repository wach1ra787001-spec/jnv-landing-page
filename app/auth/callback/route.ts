import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { WelcomeEmailTemplate } from "@/lib/email-templates/welcome-email"
import { detectUserTimezone } from "@/lib/timezone-utils"
import { getAppOrigin, getSafeNextPath } from "@/lib/domain-routing"

const resend = new Resend(process.env.RESEND_API_KEY)

// Service-role client — bypasses RLS, safe for server-only use
const adminSupabase = createAdminClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = getSafeNextPath(searchParams.get("next"))
  const timezoneParam = searchParams.get("tz")

  console.log("[auth/callback] Code exchange started")

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    console.log("[auth/callback] Session exchange result:", { error, userId: data?.user?.id })

    if (!error && data.user) {
      const detectedTimezone = timezoneParam || detectUserTimezone()
      const userId = data.user.id
      const userEmail = data.user.email!

      console.log("[auth/callback] Creating profile for user:", { userId, userEmail, timezone: detectedTimezone })

      // Check if profile already exists (i.e. returning user)
      const { data: existingProfile, error: checkError } = await adminSupabase
        .from("profiles")
        .select("welcome_email_sent")
        .eq("id", userId)
        .single()

      console.log("[auth/callback] Existing profile check:", { exists: !!existingProfile, error: checkError?.message })

      const isFirstLogin = !existingProfile // no row = brand new user

      // Upsert profile — new users default to 'user' role and 'free' plan
      const { error: upsertError, data: upsertedProfile } = await adminSupabase.from("profiles").upsert(
        {
          id: userId,
          email: userEmail,
          full_name: data.user.user_metadata?.full_name || "",
          timezone: detectedTimezone,
          role: 'user', // New users always get 'user' role
          subscription_tier: 'free', // New users start on free plan
          ...(isFirstLogin && { welcome_email_sent: false }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

      if (upsertError) {
        console.error("[auth/callback] Profile upsert failed:", {
          error: upsertError,
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          userId,
          userEmail,
        })
        // Even if upsert fails, continue to redirect — user might still be able to log in
      } else {
        console.log("[auth/callback] Profile upserted successfully:", { userId, isFirstLogin })
      }

      // All users go to dashboard — free plan by default
      const redirectPath = next

      // Send welcome email only on first login — after plan selection/payment
      if (isFirstLogin && process.env.RESEND_API_KEY) {
        try {
          const dashboardUrl = `${
            process.env.NEXT_PUBLIC_BASE_URL || "https://jnvtradingjournal.com"
          }/dashboard`

          const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: userEmail,
            subject: "Welcome to JNV Pro — let's build your edge",
            react: WelcomeEmailTemplate({
              name: data.user.user_metadata?.full_name || "Trader",
              email: userEmail,
              dashboardUrl,
            }),
          })

          if (!emailError) {
            // Mark as sent
            await adminSupabase
              .from("profiles")
              .update({
                welcome_email_sent: true,
                welcome_email_sent_at: new Date().toISOString(),
              })
              .eq("id", userId)
            console.log("[auth/callback] Welcome email sent successfully to:", userEmail)
          } else {
            console.error("[auth/callback] Resend error:", emailError)
          }
        } catch (err) {
          console.error("[auth/callback] Email send failed:", err)
          // Non-blocking — user still gets redirected
        }
      }

      const redirectUrl = new URL(redirectPath, getAppOrigin(request.nextUrl.hostname))
      return NextResponse.redirect(redirectUrl)
    }

    console.error("[auth/callback] Session exchange failed:", error)
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${request.nextUrl.origin}/auth/error`)
}

