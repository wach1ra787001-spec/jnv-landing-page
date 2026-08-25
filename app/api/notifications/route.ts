import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeWinLossStreaks, type StreakTrade } from "@/lib/streaks-analysis-utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] }, { status: 401 })

  const { data: trades, error } = await supabase
    .from("trades")
    .select("id, entry_time, exit_time, net_pnl, pnl, status, followed_plan, strategy")
    .eq("user_id", user.id)
    .eq("status", "closed")
    .order("entry_time", { ascending: true })

  if (error) {
    console.error("[v0] Notification streak query failed:", error)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }

  const streaks = computeWinLossStreaks((trades || []) as StreakTrade[])
  const current = streaks.currentStreak
  if (!current || current.type !== "loss" || current.length < 2) {
    return NextResponse.json({ notifications: [] })
  }

  const chronological = (trades || []).filter((trade) => trade.entry_time).slice(-current.length)
  const modelNotFollowed = chronological.some((trade) => trade.followed_plan !== true)
  if (!modelNotFollowed) return NextResponse.json({ notifications: [] })

  const lastTrade = chronological[chronological.length - 1]
  const streakKey = `${current.type}-${current.length}-${lastTrade?.id || "latest"}`
  return NextResponse.json({ notifications: [{
    id: `streak-${streakKey}`,
    type: "rule",
    title: `${current.length}-trade losing streak`,
    message: `Your current losing streak includes trades where the model was not followed. Review your playbook rules before taking the next trade.`,
    timestamp: lastTrade?.entry_time || new Date().toISOString(),
    read: false,
  }] })
}
