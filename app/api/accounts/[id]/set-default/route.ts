import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in POST /api/accounts/[id]/set-default:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
