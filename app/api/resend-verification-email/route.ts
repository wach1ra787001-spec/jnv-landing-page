import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Resends the email verification link to the user
 * This endpoint helps users who didn't receive or whose link expired
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Resend the signup confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      console.error('[v0] Error resending verification email:', error)
      return NextResponse.json(
        { error: 'If an account exists, a verification email will be sent.' },
        { status: 500 }
      )
    }

    console.log('[v0] Verification email resent to:', email)

    return NextResponse.json(
      { success: true, message: 'Verification email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Unexpected error in resend-verification-email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
