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

    if (!urls || !Array.isArray(urls) || urls.length === 0 || urls.length > 25 || urls.some((url) => typeof url !== 'string')) {
      return NextResponse.json({ error: 'Provide between 1 and 25 valid URLs' }, { status: 400 })
    }

    const ownedUrls = urls.filter((url: string) => url.includes(`/avatars/${user.id}/`) || url.includes(`/trades/${user.id}/`))
    if (ownedUrls.length !== urls.length) {
      return NextResponse.json({ error: 'You can only sign URLs owned by your account' }, { status: 403 })
    }

    const signedUrls = await generateSignedBlobUrls(ownedUrls)

    return NextResponse.json({ urls: signedUrls })
  } catch (error) {
    console.error('[v0] Blob signing error:', error)
    return NextResponse.json({ error: 'Failed to sign URLs', details: String(error) }, { status: 500 })
  }
}
