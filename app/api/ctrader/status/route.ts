import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connection, error } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker', 'ctrader')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No connection found - return null
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(connection)
  } catch (error) {
    console.error('[cTrader Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
