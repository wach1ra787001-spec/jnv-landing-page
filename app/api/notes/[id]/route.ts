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
      .from('trade_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching note:', error)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
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
    const { data, error } = await supabase
      .from('trade_notes')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error('[v0] Error updating note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
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

    // Verify the note belongs to the user
    const { data: note } = await supabase
      .from('trade_notes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!note || note.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete the note
    const { error } = await supabase
      .from('trade_notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Delete note error:', error.message)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Delete note exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

