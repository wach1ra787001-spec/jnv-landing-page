import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/security/auth-guards"

type Trade = {
  id: string
  symbol: string | null
  direction: string | null
  entry_time: string | null
  exit_time: string | null
  entry_price: number | null
  exit_price: number | null
  pnl: number | null
  net_pnl: number | null
  status: string | null
  strategy: string | null
  setup_type: string | null
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function makePdf(lines: string[]) {
  const safeLines = lines.map((line) => line.replaceAll(/[()\\]/g, "\\$&").slice(0, 110))
  const commands = ["BT", "/F1 12 Tf", "72 740 Td", ...safeLines.flatMap((line, index) => [index ? "0 -18 Td" : "", `(${line}) Tj`]), "ET"].filter(Boolean).join(" ")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return pdf
}

export async function GET(request: NextRequest) {
  const { supabase, user, response } = await requireAuthenticatedUser()
  if (response || !user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = request.nextUrl.searchParams
  const format = params.get("format")
  const start = params.get("start")
  const end = params.get("end")
  if (!format || !["json", "csv", "pdf"].includes(format) || !start || !end) {
    return NextResponse.json({ error: "format, start, and end are required" }, { status: 400 })
  }

  const { data: trades, error } = await supabase.from("trades").select("id,symbol,direction,entry_time,exit_time,entry_price,exit_price,pnl,net_pnl,status,strategy,setup_type").gte("entry_time", `${start}T00:00:00.000Z`).lte("entry_time", `${end}T23:59:59.999Z`).order("entry_time", { ascending: true })
  if (error) return NextResponse.json({ error: "Unable to generate report" }, { status: 500 })

  const rows = (trades ?? []) as Trade[]
  const report = { generatedAt: new Date().toISOString(), period: { start, end }, format, totalTrades: rows.length, trades: rows }
  const filename = `jnv-report-${end}`
  if (format === "json") return new NextResponse(JSON.stringify(report, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.json"` } })
  if (format === "csv") {
    const columns = ["id", "symbol", "direction", "entry_time", "exit_time", "entry_price", "exit_price", "pnl", "net_pnl", "status", "strategy", "setup_type"]
    const body = [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column as keyof Trade])).join(","))].join("\n")
    return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.csv"` } })
  }
  const pdf = makePdf(["JNV Trading Report", `Period: ${start} to ${end}`, `Total trades: ${rows.length}`, "", ...rows.slice(0, 32).map((trade) => `${trade.symbol ?? "Unknown"} | ${trade.direction ?? ""} | Net P/L: ${trade.net_pnl ?? trade.pnl ?? 0}`)])
  return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}.pdf"` } })
}
