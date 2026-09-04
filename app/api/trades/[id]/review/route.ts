import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trade } = await supabase.from('trades').select('id').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

  const { data: existing } = await supabase.from('trade_journal').select('id').eq('user_id', user.id).eq('trade_id', id).limit(1).maybeSingle()
  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase.from('trade_journal').insert({
    user_id: user.id,
    trade_id: id,
    entry_type: 'post_trade',
    content: 'Trade reviewed',
  }).select().single()

  if (error) return NextResponse.json({ error: 'Could not mark trade as reviewed' }, { status: 500 })
  return NextResponse.json(data)
}
