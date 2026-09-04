import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('broker_connections')
    .update({
      is_connected: false,
      encrypted_access_token: null,
      encrypted_refresh_token: null,
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('broker', 'tradelocker')

  if (error) return NextResponse.json({ error: 'Could not disconnect TradeLocker' }, { status: 500 })

  return NextResponse.json({ success: true })
}
