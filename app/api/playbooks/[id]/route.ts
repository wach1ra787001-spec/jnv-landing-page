import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('playbooks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching playbook:', error)
    return NextResponse.json({ error: 'Failed to fetch playbook' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const incomingRules = body.rules && typeof body.rules === 'object' ? body.rules as Record<string, unknown> : {}
    const normalizeCriteria = (value: unknown) => Array.isArray(value) ? value.filter((rule) => {
      if (typeof rule === 'string') return rule.trim().length > 0
      return Boolean(rule && typeof rule === 'object' && (((rule as Record<string, unknown>).title as string)?.trim() || ((rule as Record<string, unknown>).description as string)?.trim()))
    }) : []
    const entry = normalizeCriteria(incomingRules.entry ?? incomingRules.entryCriteria)
    const exit = normalizeCriteria(incomingRules.exit ?? incomingRules.exitCriteria)
    const color = typeof body.color === 'string' && /^#[0-9A-F]{6}$/i.test(body.color) ? body.color : typeof incomingRules.color === 'string' ? incomingRules.color : '#FF6B35'
    const allowedLinks = Array.isArray(body.youtube_links) ? body.youtube_links.filter((link: unknown) => typeof link === 'string' && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(link)).slice(0, 10) : []
    const update = {
      title: String(body.title || '').trim(),
      description: body.description,
      strategy_type: String(body.strategy_type || '').trim(),
      is_public: body.is_public === true,
      rules: { ...incomingRules, entry, exit, color },
      tags: Array.isArray(body.tags) ? body.tags : [],
      public_display_name: body.is_public ? String(body.public_display_name || '').trim() || null : null,
      public_avatar_url: body.is_public ? String(body.public_avatar_url || '').trim() || null : null,
      youtube_links: body.is_public ? allowedLinks : [],
    }
    const { data, error } = await supabase
      .from('playbooks')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error('[v0] Error updating playbook:', error)
    return NextResponse.json({ error: 'Failed to update playbook' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('playbooks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete playbook' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
