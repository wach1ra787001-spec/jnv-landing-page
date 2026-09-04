import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accountId } = await request.json().catch(() => ({}))
  const id = Number(accountId)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'A valid accountId is required' }, { status: 400 })
  const { error } = await supabase.from('broker_connections').update({ selected_account_id: id, updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('broker', 'tradelocker').eq('tradelocker_account_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ selectedAccountId: id })
}
