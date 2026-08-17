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

    return NextResponse.json(accounts)
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
    const { account_name, account_type, broker_connection_id, currency, initial_balance, notes } = body

    if (!account_name || !account_type) {
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
