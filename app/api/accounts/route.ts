import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    const { data: connections, error: connectionsError } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_connected', true)
      .eq('broker', 'tradelocker')

    if (connectionsError) {
      console.error('[v0] Error fetching connected broker accounts:', connectionsError)
      return NextResponse.json(accounts)
    }

    const accountRows = accounts ?? []
    const linkedConnectionIds = new Set(accountRows.map((account) => account.broker_connection_id).filter(Boolean))
    const missingConnections = (connections ?? []).filter((connection) => !linkedConnectionIds.has(connection.id))

    if (missingConnections.length > 0) {
      const { data: materializedAccounts, error: materializeError } = await supabase
        .from('accounts')
        .insert(missingConnections.map((connection) => ({
          user_id: user.id,
          account_name: connection.account_name || `TradeLocker ${connection.account_login ? `#${connection.account_login}` : 'account'}`,
          account_type: 'tradelocker',
          broker_connection_id: connection.id,
          currency: connection.currency || 'USD',
          initial_balance: connection.initial_balance ?? null,
          notes: connection.broker_name ? `Broker: ${connection.broker_name}` : null,
          risk_percent: 1,
          risk_amount: 1,
          is_active: true,
        })))
        .select('*')

      if (!materializeError && materializedAccounts) accountRows.push(...materializedAccounts)
      else console.error('[v0] Failed to materialize connected accounts:', materializeError)
    }

    return NextResponse.json(accountRows)
  } catch (error) {
    console.error('[v0] Error in GET /api/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { account_name, account_type, broker_connection_id, currency, initial_balance, notes, risk_percent, risk_amount } = body
    const parsedRiskPercent = Number(risk_percent)
    const parsedRiskAmount = Number(risk_amount)

    if (!account_name || !account_type || !Number.isFinite(parsedRiskPercent) || parsedRiskPercent <= 0 || parsedRiskPercent > 100 || !Number.isFinite(parsedRiskAmount) || parsedRiskAmount <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: newAccount, error } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: user.id,
          account_name,
          account_type,
          broker_connection_id,
          currency,
          initial_balance,
          notes,
          risk_percent: parsedRiskPercent,
          risk_amount: parsedRiskAmount,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating account:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Account with this name already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Check if this is the first account and assign orphaned trades
    const { data: existingAccounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .neq('id', newAccount.id)

    if (!existingAccounts || existingAccounts.length === 0) {
      // This is the first account - assign all orphaned trades to it
      const { error: updateTradesError } = await supabase
        .from('trades')
        .update({ account_id: newAccount.id })
        .eq('user_id', user.id)
        .is('account_id', null)

      if (updateTradesError) {
        console.error('[v0] Error assigning orphaned trades:', updateTradesError)
      }

      // Set this as the default account
      await supabase
        .from('profiles')
        .update({ default_account_id: newAccount.id })
        .eq('id', user.id)
    }

    return NextResponse.json(newAccount, { status: 201 })
  } catch (error) {
    console.error('[v0] Error in POST /api/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
