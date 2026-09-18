import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('csv_imports')
    .select('*')
    .eq('user_id', user.id)
    .is('journaled_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not load pending imports' }, { status: 500 })
  return NextResponse.json({ trades: data ?? [] })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json().catch(() => ({}))
  if (typeof id !== 'string') return NextResponse.json({ error: 'Import id is required' }, { status: 400 })

  const { error } = await supabase.from('csv_imports').delete().eq('id', id).eq('user_id', user.id).is('journaled_at', null)
  if (error) return NextResponse.json({ error: 'Could not remove pending import' }, { status: 500 })
  return NextResponse.json({ success: true })
}
