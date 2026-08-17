import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has any accounts
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, account_name')
      .eq('user_id', user.id)
      .limit(1)

    if (error) {
      console.error('[v0] Error checking accounts:', error)
      return NextResponse.json({ error: 'Failed to check accounts' }, { status: 500 })
    }

    const hasAccounts = accounts && accounts.length > 0

    // Get default account if exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_account_id')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      hasAccounts,
      defaultAccountId: profile?.default_account_id,
    })
  } catch (error) {
    console.error('[v0] Error in GET /api/accounts/check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
