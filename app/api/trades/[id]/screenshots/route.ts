import { createClient } from '@/lib/supabase/server'
import { put, del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id: tradeId } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trade belongs to user
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('id, screenshot_urls')
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .single()

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Upload files to Vercel Blob
    const uploadedUrls: string[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue
      }

      const buffer = await file.arrayBuffer()
      const timestamp = Date.now()
      const blobName = `trades/${user.id}/${tradeId}/${timestamp}-${file.name}`

      const blob = await put(blobName, buffer, {
        access: 'public',
        contentType: file.type,
      })

      uploadedUrls.push(blob.url)
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: 'No valid image files provided' }, { status: 400 })
    }

    // Update trade with new screenshot URLs
    const existingUrls = trade.screenshot_urls || []
    const updatedUrls = [...existingUrls, ...uploadedUrls]

    const { error: updateError } = await supabase
      .from('trades')
      .update({ screenshot_urls: updatedUrls })
      .eq('id', tradeId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[v0] Error updating trade screenshots:', updateError)
      return NextResponse.json({ error: 'Failed to save screenshots' }, { status: 500 })
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error uploading screenshots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id: tradeId } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    // Verify trade belongs to user and get current screenshot_urls
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('id, screenshot_urls')
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .single()

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    const existingUrls: string[] = trade.screenshot_urls || []

    // Find the original blob URL — the stored URL may differ from the signed URL
    // passed from the client, so match by the pathname segment
    const urlPath = new URL(url).pathname
    const originalUrl = existingUrls.find(u => {
      try { return new URL(u).pathname === urlPath } catch { return u === url }
    }) ?? url

    // Remove from the array (filter both the original and any signed variant)
    const updatedUrls = existingUrls.filter(u => {
      try { return new URL(u).pathname !== urlPath } catch { return u !== url }
    })

    // Persist updated array to DB
    const { error: updateError } = await supabase
      .from('trades')
      .update({ screenshot_urls: updatedUrls })
      .eq('id', tradeId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[v0] Error updating screenshot_urls:', updateError)
      return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
    }

    // Delete from Vercel Blob (best-effort — don't fail the request if this errors)
    try {
      await del(originalUrl)
    } catch (blobErr) {
      console.error('[v0] Blob delete failed (non-fatal):', blobErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting screenshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
