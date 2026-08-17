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
      .from('user_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching rules:', error)
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[v0] Rules GET error:', error)
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

    // Get max sort order
    const { data: maxData } = await supabase
      .from('user_rules')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const sort_order = (maxData?.[0]?.sort_order ?? -1) + 1

    const { data, error } = await supabase
      .from('user_rules')
      .insert({
        user_id: user.id,
        title: body.title,
        rule: body.rule || body.description,
        is_active: body.is_active !== false,
        sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating rule:', error)
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Rules POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

