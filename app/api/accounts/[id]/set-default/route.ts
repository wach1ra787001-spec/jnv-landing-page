import { createClient } from '@/lib/supabase/server'
import { SELECTED_ACCOUNT_COOKIE } from '@/lib/account-selection'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
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
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Update default_account_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ default_account_id: id })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error updating default account:', updateError)
      return NextResponse.json({ error: 'Failed to update default account' }, { status: 500 })
    }

    // Persist the selection in a cookie too, so it takes effect immediately
    // across every server-rendered page without waiting on cached profile reads.
    const cookieStore = await cookies()
    cookieStore.set(SELECTED_ACCOUNT_COOKIE, id, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in POST /api/accounts/[id]/set-default:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
