import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { attachPlaybookMetrics, getPlaybookMetrics } from '@/lib/playbooks/metrics'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const publicOnly = request.nextUrl.searchParams.get('public') === 'true'

    if (publicOnly) {
      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json(await attachPlaybookMetrics((data || []) as Array<{ id: string; user_id: string }>, true))
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('playbooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching playbooks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(await attachPlaybookMetrics((data || []) as Array<{ id: string; user_id: string }>))
  } catch (error) {
    console.error('Fetch playbooks error:', error)
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
    const { title, description, rules, strategy_type, tags, is_active } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('playbooks')
      .insert({
        user_id: user.id,
        title,
        description: description || '',
        rules: rules || {},
        strategy_type: strategy_type || 'general',
        tags: tags || [],
        is_public: false,
        public_slug: `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 8)}`,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating playbook:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create playbook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

