import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSignedBlobUrls } from '@/lib/blob-signed-url'

/**
 * API endpoint to generate signed URLs for private blob files
 * This should only be called from the server or by authenticated users
 * 
 * POST /api/blob/sign
 * Body: { urls: string[] }
 * Returns: { urls: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    }

    console.log('[v0] Generating signed URLs for', urls.length, 'blobs')
    const signedUrls = await generateSignedBlobUrls(urls)

    return NextResponse.json({ urls: signedUrls })
  } catch (error) {
    console.error('[v0] Blob signing error:', error)
    return NextResponse.json({ error: 'Failed to sign URLs', details: String(error) }, { status: 500 })
  }
}
