import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase.from('broker_connections')
    .update({
      is_connected:   false,
      access_token:   null,
      refresh_token:  null,
    })
    .eq('user_id', user.id)
    .eq('broker', 'ctrader')

  // Trades are kept — never deleted on disconnect
  return NextResponse.json({ success: true })
}
