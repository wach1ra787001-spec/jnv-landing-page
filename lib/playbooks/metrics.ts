import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type PlaybookMetrics = {
  trades_taken: number
  winning_trades: number
  win_rate: number
  pnl: number
}

const emptyMetrics: PlaybookMetrics = { trades_taken: 0, winning_trades: 0, win_rate: 0, pnl: 0 }

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

export async function getPlaybookMetrics(playbookId: string, ownerId: string, privileged = false): Promise<PlaybookMetrics> {
  const sessionClient = await createClient()
  const supabase = privileged && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    : sessionClient

  const { data: playbook } = await supabase.from('playbooks').select('strategy_type').eq('id', playbookId).eq('user_id', ownerId).single()
  if (!playbook) return emptyMetrics

  const { data: trades, error } = await supabase
    .from('trades')
    .select('strategy, setup_type, pnl, net_pnl, status')
    .eq('user_id', ownerId)
  if (error) {
    console.error('[v0] Failed to aggregate playbook metrics:', error)
    return emptyMetrics
  }

  const strategy = normalize(playbook.strategy_type)
  const matchingTrades = (trades ?? []).filter((trade) => {
    const labels = [trade.strategy, trade.setup_type].map(normalize).filter(Boolean)
    return strategy && labels.includes(strategy)
  })
  const closedTrades = matchingTrades.filter((trade) => !trade.status || ['closed', 'completed'].includes(normalize(trade.status)))
  const winningTrades = closedTrades.filter((trade) => Number(trade.net_pnl ?? trade.pnl ?? 0) > 0)
  const pnl = closedTrades.reduce((sum, trade) => sum + Number(trade.net_pnl ?? trade.pnl ?? 0), 0)

  return {
    trades_taken: closedTrades.length,
    winning_trades: winningTrades.length,
    win_rate: closedTrades.length ? Number(((winningTrades.length / closedTrades.length) * 100).toFixed(2)) : 0,
    pnl: Number(pnl.toFixed(2)),
  }
}

export async function attachPlaybookMetrics<T extends { id: string; user_id: string }>(playbooks: T[], privileged = false) {
  return Promise.all(playbooks.map(async (playbook) => ({
    ...playbook,
    ...(await getPlaybookMetrics(playbook.id, playbook.user_id, privileged)),
  })))
}
