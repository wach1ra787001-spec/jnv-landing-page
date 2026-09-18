/**
 * Shared client-side queue for trades that have been mapped/imported (from a
 * CSV file today, and from future broker connections such as MT5, cTrader,
 * TradingView, or Interactive Brokers) but have not yet been journaled.
 *
 * Imported trades are staged here instead of being saved directly to the
 * database. A trade only becomes a real row in Trade History once the user
 * completes it through the same "Log a Trade" form used for manual trades
 * (attaching a strategy, rules followed, notes, and screenshots).
 */

const STORAGE_KEY = "jnv_pending_import_trades"

export interface PendingImportedTrade {
  symbol?: string
  direction?: "long" | "short" | string
  entry_price?: number
  exit_price?: number | null
  lot_size?: number
  open_time?: string
  close_time?: string
  pnl?: number
  status?: string
  external_ref?: string
  source_label?: string
  [key: string]: unknown
}

function readQueue(): PendingImportedTrade[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("[v0] Could not read pending imported trades:", error)
    return []
  }
}

function writeQueue(trades: PendingImportedTrade[]) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trades))
  } catch (error) {
    console.error("[v0] Could not persist pending imported trades:", error)
  }
}

export function getPendingImportedTrades(): PendingImportedTrade[] {
  return readQueue()
}

export function getPendingImportedTradesCount(): number {
  return readQueue().length
}

/** Replaces the entire queue, e.g. right after a successful import. */
export function setPendingImportedTrades(trades: PendingImportedTrade[], sourceLabel?: string) {
  writeQueue(sourceLabel ? trades.map((t) => ({ ...t, source_label: t.source_label ?? sourceLabel })) : trades)
}

export function getPendingImportedTradeAt(index: number): PendingImportedTrade | null {
  const queue = readQueue()
  return queue[index] ?? null
}

/** Removes a single trade (by index) once it has been journaled and saved. */
export function removePendingImportedTradeAt(index: number): PendingImportedTrade[] {
  const queue = readQueue()
  queue.splice(index, 1)
  writeQueue(queue)
  return queue
}

export function clearPendingImportedTrades() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(STORAGE_KEY)
}

export function subscribeToPendingImports(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback()
  }
  window.addEventListener("storage", handler)
  return () => window.removeEventListener("storage", handler)
}
