import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieClient = await createServerClient()
    let supabase = cookieClient
    let { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
      if (token) {
        supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const result = await supabase.auth.getUser(token)
        user = result.data.user
      }
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { templateId } = await request.json()
    if (typeof templateId !== 'string' || !templateId) return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })

    const { data: source, error: sourceError } = await supabase
      .from('playbooks')
      .select('title, description, rules, strategy_type, tags')
      .eq('id', templateId)
      .eq('is_public', true)
      .maybeSingle()
    if (sourceError) throw sourceError
    if (!source) return NextResponse.json({ error: 'Public template not found' }, { status: 404 })

    const { data: imported, error } = await supabase
      .from('playbooks')
      .insert({ user_id: user.id, title: `${source.title} (Copy)`, description: source.description || '', rules: source.rules || {}, strategy_type: source.strategy_type || 'general', tags: source.tags || [], is_public: false, youtube_links: [] })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(imported, { status: 201 })
  } catch (error) {
    console.error('[v0] Import playbook error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to import template' }, { status: 500 })
  }
}
