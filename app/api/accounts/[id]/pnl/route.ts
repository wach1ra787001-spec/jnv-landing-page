import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, initial_balance')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get all trades for this account and calculate PnL
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('net_pnl, status, entry_time')
      .eq('account_id', id)
      .eq('user_id', user.id)

    if (tradesError) {
      console.error('[v0] Error fetching trades:', tradesError)
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
    }

    const totalPnL = (trades || []).reduce((sum, trade) => sum + (trade.net_pnl || 0), 0)
    const winningTrades = (trades || []).filter(t => (t.net_pnl || 0) > 0).length
    const losingTrades = (trades || []).filter(t => (t.net_pnl || 0) < 0).length
    const totalTrades = trades?.length || 0
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    return NextResponse.json({
      account_id: id,
      total_pnl: totalPnL,
      winning_trades: winningTrades,
      losing_trades: losingTrades,
      total_trades: totalTrades,
      win_rate: winRate,
      initial_balance: account.initial_balance,
    })
  } catch (error) {
    console.error('[v0] Error in GET /api/accounts/[id]/pnl:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
