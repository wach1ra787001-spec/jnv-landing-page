import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const action = body.action

  if (action === 'deactivate') {
    const { data, error } = await supabase.from('playbooks').update({ is_active: false }).eq('id', id).eq('user_id', user.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'activate' || action === 'publish') {
    const { data: owned } = await supabase.from('playbooks').select('id').eq('id', id).eq('user_id', user.id).single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (action === 'activate') {
      await supabase.from('playbooks').update({ is_active: false }).eq('user_id', user.id)
      const { data, error } = await supabase.from('playbooks').update({ is_active: true }).eq('id', id).eq('user_id', user.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
    const { data, error } = await supabase.from('playbooks').update({ is_public: Boolean(body.value) }).eq('id', id).eq('user_id', user.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'like') {
    const { data: existing } = await supabase.from('playbook_likes').select('playbook_id').eq('playbook_id', id).eq('user_id', user.id).maybeSingle()
    const result = existing
      ? await supabase.from('playbook_likes').delete().eq('playbook_id', id).eq('user_id', user.id)
      : await supabase.from('playbook_likes').insert({ playbook_id: id, user_id: user.id })
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
    const { data: counts } = await supabase.from('playbooks').select('likes_count').eq('id', id).single()
    return NextResponse.json({ liked: !existing, likes_count: counts?.likes_count ?? 0 })
  }

  if (action === 'share') {
    const { error } = await supabase.from('playbook_shares').insert({ playbook_id: id, user_id: user.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'comment') {
    const content = String(body.content || '').trim()
    if (!content || content.length > 1000) return NextResponse.json({ error: 'Comment must be 1–1000 characters' }, { status: 400 })
    const { data, error } = await supabase.from('playbook_comments').insert({ playbook_id: id, user_id: user.id, content }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
