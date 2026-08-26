import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeWinLossStreaks, type StreakTrade } from "@/lib/streaks-analysis-utils"
import { sendLossStreakWarningEmail } from "@/lib/email/resend-service"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] }, { status: 401 })

  const { data: trades, error } = await supabase
    .from("trades")
    .select("id, entry_time, exit_time, pnl, status, followed_plan, discipline_rating, mistakes, strategy")
    .eq("user_id", user.id)
    .eq("status", "closed")
    .order("entry_time", { ascending: true })

  if (error) {
    console.error("[v0] Notification streak query failed:", error)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }

  const streaks = computeWinLossStreaks((trades || []) as StreakTrade[])
  const current = streaks.currentStreak
  if (!current || current.type !== "loss" || current.length < 2) return NextResponse.json({ notifications: [] })

  const chronological = (trades || []).filter((trade) => trade.exit_time || trade.entry_time).slice(-current.length)
  const modelNotFollowed = chronological.some((trade) => trade.followed_plan !== true)
  if (!modelNotFollowed) return NextResponse.json({ notifications: [] })

  const lastTrade = chronological[chronological.length - 1]
  const streakKey = `${current.type}-${current.length}-${lastTrade?.id || "latest"}`
  const notification = { id: `streak-${streakKey}`, type: "rule", title: `${current.length}-trade losing streak`, message: `Your current losing streak includes trades where the model was not followed. Review your playbook rules before taking the next trade.`, timestamp: lastTrade?.entry_time || new Date().toISOString(), read: false }
  if (request.method === "POST") {
    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle()
    if (!profile?.email) return NextResponse.json({ notifications: [notification], emailSent: false })
    const { data: existing } = await supabase.from("ai_email_logs").select("id").eq("user_id", user.id).eq("email_type", "loss_streak_warning").eq("subject", notification.title).limit(1)
    if (!existing?.length) {
      try {
        const email = await sendLossStreakWarningEmail({ userEmail: profile.email, userName: profile.full_name, streakLength: current.length })
        await supabase.from("ai_email_logs").insert({ user_id: user.id, email_type: "loss_streak_warning", subject: notification.title, body: notification.message, resend_email_id: email.messageId, status: "sent", sent_at: new Date().toISOString() })
        return NextResponse.json({ notifications: [notification], emailSent: true })
      } catch (error) {
        console.error("[v0] Loss streak email failed:", error)
      }
    }
  }
  return NextResponse.json({ notifications: [notification], emailSent: false })
}

export async function POST(request: Request) {
  return GET(request)
}
