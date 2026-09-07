import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function isComplete(profile: any, accounts: any[], playbooks: any[]) {
  const preferences = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences : {}
  const firstName = typeof preferences.first_name === 'string' ? preferences.first_name.trim() : ''
  return Boolean(firstName && accounts.length > 0 && playbooks.length > 0)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: accounts }, { data: playbooks }] = await Promise.all([
    supabase.from('profiles').select('full_name, preferences').eq('id', user.id).maybeSingle(),
    supabase.from('accounts').select('id, account_name, account_type, broker_connection_id').eq('user_id', user.id),
    supabase.from('playbooks').select('id, title').eq('user_id', user.id),
  ])
  const preferences = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences : {}
  return NextResponse.json({
    complete: isComplete(profile, accounts ?? [], playbooks ?? []),
    firstName: preferences.first_name ?? '',
    preferredName: preferences.preferred_name ?? '',
    accounts: accounts ?? [],
    playbooks: playbooks ?? [],
    userName: user.user_metadata?.full_name ?? profile?.full_name ?? '',
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 80) : ''
  const preferredName = typeof body.preferredName === 'string' ? body.preferredName.trim().slice(0, 80) : ''
  if (!firstName) return NextResponse.json({ error: 'First name is required' }, { status: 400 })

  const { data: current } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle()
  const preferences = current?.preferences && typeof current.preferences === 'object' ? current.preferences : {}
  const { error } = await supabase.from('profiles').update({
    full_name: preferredName || firstName,
    preferences: { ...preferences, first_name: firstName, preferred_name: preferredName },
  }).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'Could not save your name' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PUT() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [profileResult, accountsResult, playbooksResult] = await Promise.all([
    supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle(),
    supabase.from('accounts').select('id').eq('user_id', user.id),
    supabase.from('playbooks').select('id').eq('user_id', user.id),
  ])
  if (profileResult.error || accountsResult.error || playbooksResult.error) {
    console.error('[v0] Onboarding completion query failed:', profileResult.error, accountsResult.error, playbooksResult.error)
    return NextResponse.json({ error: 'Could not verify your onboarding steps. Please try again.' }, { status: 500 })
  }
  const { data: profile } = profileResult
  const { data: accounts } = accountsResult
  const { data: playbooks } = playbooksResult
  const preferences = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences : {}
  if (!isComplete({ preferences }, accounts ?? [], playbooks ?? [])) {
    return NextResponse.json({ error: 'Complete all onboarding steps first' }, { status: 400 })
  }
  const { error } = await supabase.from('profiles').update({ preferences: { ...preferences, onboarding_complete: true } }).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'Could not finish onboarding' }, { status: 500 })
  return NextResponse.json({ complete: true })
}
