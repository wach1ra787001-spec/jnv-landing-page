import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { computeWinLossStreaks, type StreakTrade } from "@/lib/streaks-analysis-utils"
import { calculateAverageConsistencyScore, hasMeaningfulJournalNotes } from "@/lib/consistency-score"
import { sendLossStreakWarningEmail } from "@/lib/email/resend-service"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const cookieClient = await createServerClient()
  let supabase = cookieClient
  let { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    if (token) {
      supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const result = await supabase.auth.getUser(token)
      user = result.data.user
    }
  }
  if (!user) return NextResponse.json({ notifications: [] }, { status: 401 })

  const { data: trades, error } = await supabase
    .from("trades")
    .select("id, entry_time, exit_time, pnl, status, strategy, risk_percent")
    .eq("user_id", user.id)
    .eq("status", "closed")
    .order("entry_time", { ascending: true })

  if (error) {
    console.error("[v0] Notification streak query failed:", error)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }

  const streaks = computeWinLossStreaks((trades || []) as StreakTrade[])
  const current = streaks.currentStreak
  const { data: journals, error: journalsError } = await supabase.from("trade_journal").select("trade_id, confidence_level, content, lessons_learned").eq("user_id", user.id)
  if (journalsError) console.error("[v0] Notification journal query failed:", journalsError)
  const journalByTradeId = new Map((journals || []).map((journal) => [journal.trade_id, journal]))
  const consistency = calculateAverageConsistencyScore((trades || []).map((trade) => {
    const journal = journalByTradeId.get(trade.id)
    return { hasActiveRules: true, activeRulesCount: 1, disciplineRating: journal?.confidence_level, followedPlan: undefined, hasMeaningfulNotes: hasMeaningfulJournalNotes(journal, []) }
  }))
  const hasLossStreak = current?.type === "loss" && current.length >= 2
  const shouldNotify = hasLossStreak && consistency < 50
  if (!shouldNotify) return NextResponse.json({ notifications: [] })

  const chronological = (trades || []).filter((trade) => trade.exit_time || trade.entry_time).slice(-current!.length)
  const lastTrade = chronological[chronological.length - 1]
  const streakLength = current?.length || 0
  const streakKey = `${hasLossStreak ? `streak-${streakLength}` : "consistency-below-50"}-${lastTrade?.id || "latest"}`
  const notification = { id: streakKey, type: "rule", title: `${streakLength}-trade losing streak`, message: `You have lost ${streakLength} trades in a row and your consistency is below 50%. You are not following your trading model consistently. Review your rules before taking the next trade.`, timestamp: lastTrade?.entry_time || new Date().toISOString(), read: false }
  if (request.method === "POST") {
    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle()
    if (!profile?.email) {
      console.error("[v0] Loss streak email skipped: no email address on profile", { userId: user.id })
      return NextResponse.json({ notifications: [notification], emailSent: false, emailError: "No email address is associated with this profile." })
    }
    const { data: existing, error: logLookupError } = await supabase.from("ai_email_logs").select("id").eq("user_id", user.id).eq("email_type", "loss_streak_warning").eq("subject", notification.title).limit(1)
    if (logLookupError) console.error("[v0] Notification email log lookup failed:", logLookupError)
    if (!existing?.length) {
      try {
        const email = await sendLossStreakWarningEmail({ userEmail: profile.email, userName: profile.full_name, streakLength: streakLength || 2 })
        const { error: logError } = await supabase.from("ai_email_logs").insert({ user_id: user.id, email_type: "loss_streak_warning", subject: notification.title, body: notification.message, resend_email_id: email.messageId, status: "sent", sent_at: new Date().toISOString() })
        if (logError) console.error("[v0] Loss streak email log insert failed:", logError)
        return NextResponse.json({ notifications: [notification], emailSent: true, emailId: email.messageId })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email delivery error"
        console.error("[v0] Loss streak email failed:", { message, userId: user.id, recipient: profile.email })
        return NextResponse.json({ notifications: [notification], emailSent: false, emailError: message })
      }
    } else {
      return NextResponse.json({ notifications: [notification], emailSent: false, emailError: "This losing-streak alert was already sent." })
    }
  }
  return NextResponse.json({ notifications: [notification], emailSent: false })
}

export async function POST(request: Request) {
  return GET(request)
}
