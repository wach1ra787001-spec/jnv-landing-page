import { NextRequest, NextResponse } from 'next/server'
import { retryFailedEmailNotifications } from '@/lib/notifications/trade-import-handler'
import { hasValidCronSecret } from '@/lib/security/request-guards'

/**
 * Endpoint to retry failed email notifications
 * Should be called periodically via a cron job (e.g., every 15 minutes)
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    if (!hasValidCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API] Starting email notification retry...')

    // Run the retry process
    await retryFailedEmailNotifications()

    return NextResponse.json(
      { success: true, message: 'Email retry process completed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error in retry notifications endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to retry notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
