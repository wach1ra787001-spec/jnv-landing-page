import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import { requireAuthenticatedUser } from "@/lib/security/auth-guards"

type RecordRow = Record<string, unknown>
type CanonicalExport = {
  export_version: "1.0"
  exported_at: string
  period: { start: string; end: string }
  user_settings: RecordRow
  accounts: RecordRow[]
  trades: RecordRow[]
  performance: RecordRow
  daily_performance: RecordRow[]
  strategies: RecordRow[]
  playbooks: RecordRow[]
  tags: RecordRow[]
  rules: RecordRow[]
  journal_entries: RecordRow[]
  backtest_sessions: RecordRow[]
  backtest_trades: RecordRow[]
}

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`
const rowsToCsv = (rows: RecordRow[]) => {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  if (!columns.length) return ""
  return [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n")
}
const asRows = (data: unknown) => (Array.isArray(data) ? data as RecordRow[] : [])
const sum = (rows: RecordRow[], key: string) => rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)
const groupPerformance = (trades: RecordRow[], key: string) => {
  const groups = new Map<string, RecordRow[]>()
  for (const trade of trades) {
    const value = String(trade[key] ?? "Unknown")
    groups.set(value, [...(groups.get(value) ?? []), trade])
  }
  return [...groups.entries()].map(([value, group]) => metrics(group, key, value))
}
const metrics = (trades: RecordRow[], key?: string, value?: string): RecordRow => {
  const pnl = trades.map((trade) => Number(trade.net_pnl ?? trade.pnl ?? 0))
  const wins = pnl.filter((amount) => amount > 0)
  const losses = pnl.filter((amount) => amount < 0)
  const total = pnl.reduce((a, b) => a + b, 0)
  return { ...(key ? { [key]: value } : {}), trades: trades.length, wins: wins.length, losses: losses.length, breakevens: pnl.filter((amount) => amount === 0).length, win_rate: trades.length ? wins.length / trades.length * 100 : 0, net_pnl: total, gross_profit: wins.reduce((a, b) => a + b, 0), gross_loss: losses.reduce((a, b) => a + b, 0), profit_factor: Math.abs(losses.reduce((a, b) => a + b, 0)) ? wins.reduce((a, b) => a + b, 0) / Math.abs(losses.reduce((a, b) => a + b, 0)) : null, average_r: trades.length ? sum(trades, "r_multiple") / trades.length : 0, total_r: sum(trades, "r_multiple"), average_win: wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0, average_loss: losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0, largest_win: wins.length ? Math.max(...wins) : 0, largest_loss: losses.length ? Math.min(...losses) : 0, expectancy: trades.length ? total / trades.length : 0 }
}

function makePdf(report: CanonicalExport) {
  const lines = ["JnV Trading Performance Report", `Period: ${report.period.start} to ${report.period.end}`, `Total trades: ${report.performance.trades}`, `Net P&L: ${report.performance.net_pnl}`, `Win rate: ${report.performance.win_rate}%`, `Profit factor: ${report.performance.profit_factor ?? "N/A"}`, "", "Trade log", ...report.trades.slice(0, 30).map((trade) => `${trade.entry_time ?? ""} | ${trade.symbol ?? ""} | ${trade.direction ?? ""} | P&L ${trade.net_pnl ?? trade.pnl ?? 0}`)]
  const escaped = lines.map((line) => String(line).replaceAll(/[()\\]/g, "\\$&").slice(0, 105))
  const stream = ["BT", "/F1 11 Tf", "54 750 Td", ...escaped.flatMap((line, index) => [index ? "0 -17 Td" : "", `(${line}) Tj`]), "ET"].filter(Boolean).join(" ")
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
  let pdf = "%PDF-1.4\n"; const offsets = [0]
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return pdf
}

export async function GET(request: NextRequest) {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const params = request.nextUrl.searchParams
  const format = params.get("format")
  const start = params.get("start")
  const end = params.get("end")
  if (!format || !["json", "csv", "pdf"].includes(format) || !start || !end) return NextResponse.json({ error: "format, start, and end are required" }, { status: 400 })
  const query = async (table: string, columns = "*") => {
    const result = await supabase.from(table).select(columns)
    return result.error ? [] : asRows(result.data)
  }
  const [profile, accounts, trades, metricsRows, daily, playbooks, journals, backtestSessions, backtestTrades] = await Promise.all([
    query("profiles", "timezone,currency,preferences").then((rows) => rows[0] ?? {}),
    query("accounts"),
    supabase.from("trades").select("*").gte("entry_time", `${start}T00:00:00.000Z`).lte("entry_time", `${end}T23:59:59.999Z`).order("entry_time", { ascending: true }).then((result) => asRows(result.data)),
    query("trade_metrics"), query("daily_summaries"), query("playbooks"), query("trade_journal"), query("backtest_sessions"), query("backtest_trades"),
  ])
  const scopedDaily = daily.filter((row) => String(row.summary_date ?? "") >= start && String(row.summary_date ?? "") <= end)
  const scopedJournals = journals.filter((row) => (!row.period_start || String(row.period_start) <= end) && (!row.period_end || String(row.period_end) >= start))
  const performance = metrics(trades)
  const report: CanonicalExport = { export_version: "1.0", exported_at: new Date().toISOString(), period: { start, end }, user_settings: profile, accounts, trades, performance, daily_performance: scopedDaily, strategies: groupPerformance(trades, "strategy"), playbooks, tags: groupPerformance(trades, "tags"), rules: groupPerformance(trades, "followed_rules"), journal_entries: scopedJournals, backtest_sessions: backtestSessions, backtest_trades: backtestTrades }
  const filename = `jnv-export-${end}`
  if (format === "json") return new NextResponse(JSON.stringify(report, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.json"` } })
  if (format === "pdf") return new NextResponse(makePdf(report), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}.pdf"` } })
  const zip = new JSZip()
  const files: Record<string, RecordRow[]> = { "trades.csv": report.trades, "performance.csv": [report.performance], "daily_performance.csv": report.daily_performance, "strategy_performance.csv": report.strategies, "symbol_performance.csv": groupPerformance(trades, "symbol"), "session_performance.csv": groupPerformance(trades, "session"), "tag_performance.csv": report.tags, "discipline.csv": trades.map((trade) => ({ trade_id: trade.id, followed_rules: trade.followed_rules, risk_percent: trade.risk_percent, r_multiple: trade.r_multiple, net_pnl: trade.net_pnl ?? trade.pnl })), "journal.csv": report.journal_entries, "accounts.csv": report.accounts, "rules.csv": report.rules }
  for (const [name, rows] of Object.entries(files)) zip.file(name, rowsToCsv(rows))
  const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })
  return new NextResponse(archive, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${filename}.zip"` } })
}
