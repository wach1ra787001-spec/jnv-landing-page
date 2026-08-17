import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching goals:', error)
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[v0] Goals GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description,
        goal_type: body.goal_type,
        metric_type: body.metric_type,
        target_value: body.target_value,
        current_value: body.current_value || 0,
        start_date: body.start_date,
        end_date: body.end_date,
        status: body.status || 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating goal:', error)
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Goals POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
