import { createClient } from '@/lib/supabase/server'
import { getSelectedAccountId } from '@/lib/get-selected-account'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prefer an explicit accountId query param (threaded down from the
    // caller's already-resolved active account) and fall back to resolving
    // it server-side so the route still works when called without one.
    const requestedAccountId = request.nextUrl.searchParams.get('accountId')
    const accountId = requestedAccountId || (await getSelectedAccountId(supabase, user.id))

    // Fetch from open_positions_enriched view, scoped to the active account
    let query = supabase
      .from('open_positions_enriched')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data: positions, error } = await query

    if (error) {
      console.error('[v0] Error fetching positions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(positions || [])
  } catch (error) {
    console.error('[v0] Error in open positions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
