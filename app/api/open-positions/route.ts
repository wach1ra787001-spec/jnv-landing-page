import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch from open_positions_enriched view
    const { data: positions, error } = await supabase
      .from('open_positions_enriched')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching positions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(positions || [])
  } catch (error) {
    console.error('[v0] Error in open positions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
