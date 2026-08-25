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

    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('[v0] Error in GET /api/accounts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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

    const body = await request.json()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body.account_name === 'string' && body.account_name.trim()) update.account_name = body.account_name.trim()
    if (body.risk_percent !== undefined) { const value = Number(body.risk_percent); if (!Number.isFinite(value) || value <= 0 || value > 100) return NextResponse.json({ error: 'Invalid risk percentage' }, { status: 400 }); update.risk_percent = value }
    if (body.risk_amount !== undefined) { const value = Number(body.risk_amount); if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: 'Invalid risk amount' }, { status: 400 }); update.risk_amount = value }

    const { data: account, error: updateError } = await supabase
      .from('accounts')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !account) {
      console.error('[v0] Error updating account:', updateError)
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('[v0] Error in PATCH /api/accounts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check if this is the default account
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_account_id')
      .eq('id', user.id)
      .single()

    if (profile?.default_account_id === id) {
      // Find another active account to set as default
      const { data: otherAccounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .neq('id', id)
        .eq('is_active', true)
        .limit(1)

      if (otherAccounts && otherAccounts.length > 0) {
        await supabase
          .from('profiles')
          .update({ default_account_id: otherAccounts[0].id })
          .eq('id', user.id)
      } else {
        await supabase
          .from('profiles')
          .update({ default_account_id: null })
          .eq('id', user.id)
      }
    }

    const { error: tradesError } = await supabase.from('trades').delete().eq('account_id', id).eq('user_id', user.id)
    if (tradesError) return NextResponse.json({ error: 'Failed to delete account trades' }, { status: 500 })

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[v0] Error deleting account:', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in DELETE /api/accounts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
