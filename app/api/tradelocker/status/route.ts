import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('broker_connections').select('is_connected,selected_account_id,last_synced_at,last_sync_error').eq('user_id', user.id).eq('broker', 'tradelocker').order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || { is_connected: false })
}
