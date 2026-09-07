import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSelectedAccountId } from '@/lib/get-selected-account'

async function getUserAndAccount(requestedAccountId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, accountId: null }
  const accountId = requestedAccountId || await getSelectedAccountId(supabase, user.id)
  if (!accountId) return { supabase, user, accountId: null }
  const { data: account } = await supabase.from('accounts').select('id').eq('id', accountId).eq('user_id', user.id).maybeSingle()
  return { supabase, user, accountId: account?.id ?? null }
}

export async function GET(request: NextRequest) {
  const { supabase, user, accountId } = await getUserAndAccount(request.nextUrl.searchParams.get('accountId'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let query = supabase.from('missed_trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (accountId) query = query.eq('account_id', accountId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load missed trades' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const { supabase, user } = await getUserAndAccount(typeof body?.account_id === 'string' ? body.account_id : null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!id) return NextResponse.json({ error: 'Missed trade id is required' }, { status: 400 })
  const required = ['symbol', 'direction', 'time_of_day', 'anticipated_rr', 'timeframe', 'strategy', 'premarket_notes']
  if (required.some((field) => body?.[field] === undefined || String(body[field]).trim() === '')) return NextResponse.json({ error: 'Complete all missed trade fields' }, { status: 400 })
  const anticipatedRR = Number(body.anticipated_rr)
  if (!Number.isFinite(anticipatedRR) || anticipatedRR < 0) return NextResponse.json({ error: 'Anticipated RR must be a valid non-negative number' }, { status: 400 })
  const { data, error } = await supabase.from('missed_trades').update({
    symbol: String(body.symbol).trim().toUpperCase(), direction: String(body.direction).trim().toLowerCase(),
    time_of_day: String(body.time_of_day).trim(), anticipated_rr: anticipatedRR, timeframe: String(body.timeframe).trim(),
    strategy: String(body.strategy).trim(), premarket_notes: String(body.premarket_notes).trim(), updated_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: 'Failed to update missed trade' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const { supabase, user } = await getUserAndAccount(null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!id) return NextResponse.json({ error: 'Missed trade id is required' }, { status: 400 })
  const { error } = await supabase.from('missed_trades').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Failed to delete missed trade' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { supabase, user, accountId } = await getUserAndAccount(typeof body?.account_id === 'string' ? body.account_id : null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!accountId) return NextResponse.json({ error: 'Select an account before journaling a missed trade' }, { status: 400 })
  const required = ['symbol', 'direction', 'time_of_day', 'anticipated_rr', 'timeframe', 'strategy', 'premarket_notes']
  if (required.some((field) => body?.[field] === undefined || String(body[field]).trim() === '')) {
    return NextResponse.json({ error: 'Complete all missed trade fields' }, { status: 400 })
  }
  const anticipatedRR = Number(body.anticipated_rr)
  if (!Number.isFinite(anticipatedRR) || anticipatedRR < 0) return NextResponse.json({ error: 'Anticipated RR must be a valid non-negative number' }, { status: 400 })
  const { data, error } = await supabase.from('missed_trades').insert({
    user_id: user.id, account_id: accountId, symbol: String(body.symbol).trim().toUpperCase(),
    direction: String(body.direction).trim().toLowerCase(), time_of_day: String(body.time_of_day).trim(), anticipated_rr: anticipatedRR,
    timeframe: String(body.timeframe).trim(), strategy: String(body.strategy).trim(),
    premarket_notes: String(body.premarket_notes).trim(),
  }).select().single()
  if (error) return NextResponse.json({ error: 'Failed to save missed trade' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
