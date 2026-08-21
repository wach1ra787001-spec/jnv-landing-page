import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params
  const { data, error } = await supabase.from('playbooks').select('*').eq('public_slug', slug).eq('is_public', true).single()
  if (error || !data) return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
  return NextResponse.json(data)
}
