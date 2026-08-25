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
    const { title, description, rules, strategy_type, tags, is_public, public_display_name, public_avatar_url, youtube_links } = body
    const linkedRuleIds = Array.isArray(rules?.linkedRuleIds) ? rules.linkedRuleIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 100) : []

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const links = Array.isArray(youtube_links) ? youtube_links.filter((link: unknown) => typeof link === 'string' && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(link)).slice(0, 10) : []
    const publicProfile = Boolean(is_public)
    if (publicProfile && public_display_name && String(public_display_name).length > 80) return NextResponse.json({ error: 'Display name is too long' }, { status: 400 })

    const { data, error } = await supabase
      .from('playbooks')
      .insert({
        user_id: user.id,
        title,
        description: description || '',
        rules: { ...(rules && typeof rules === 'object' ? rules : {}), linkedRuleIds },
        strategy_type: strategy_type || 'general',
        tags: tags || [],
        is_public: publicProfile,
        public_display_name: publicProfile ? String(public_display_name || '').trim() || null : null,
        public_avatar_url: publicProfile ? String(public_avatar_url || '').trim() || null : null,
        youtube_links: publicProfile ? links : [],
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

