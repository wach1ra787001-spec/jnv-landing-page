import { createClient } from '@/lib/supabase/server'
import { generateSignedBlobUrls } from '@/lib/blob-signed-url'
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
      .from('trades')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Generate signed URLs for private blob screenshots
    if (data.screenshot_urls && data.screenshot_urls.length > 0) {
      try {
        console.log('[v0] Generating signed URLs for', data.screenshot_urls.length, 'screenshots server-side')
        data.screenshot_urls = await generateSignedBlobUrls(data.screenshot_urls)
        console.log('[v0] Signed URLs generated successfully')
      } catch (err) {
        console.error('[v0] Error generating signed URLs, returning original URLs:', err)
        // Fallback: return original URLs if signing fails
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch trade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    
    // Build update object with only allowed fields
    const updateData: Record<string, any> = {}
    
    const allowedFields = [
      'symbol', 'direction', 'entry_price', 'exit_price', 
      'stop_loss', 'take_profit', 'quantity', 'entry_time', 
      'exit_time', 'pnl', 'pnl_percent', 'r_multiple', 
      'risk_amount', 'strategy', 'setup_type', 
      'status', 'screenshot_urls'
    ]
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update trade error:', error)
      return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update trade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete trade error:', error)
      return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete trade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
