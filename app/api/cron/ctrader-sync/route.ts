import { NextRequest, NextResponse } from 'next/server'
import { syncCTraderAccounts } from '@/lib/ctrader-sync-job'

/**
 * Cron endpoint for automatic cTrader account synchronization
 * 
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/ctrader-sync",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 * 
 * Or use external service like EasyCron to POST to this endpoint
 */
export async function POST(req: NextRequest) {
  // Verify cron secret for security
  const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    console.warn('[cTrader Cron] Unauthorized cron request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[cTrader Cron] Starting synchronization job')
    const result = await syncCTraderAccounts()

    if (result.success) {
      console.log(`[cTrader Cron] Job completed successfully - Synced: ${result.synced}`)
      return NextResponse.json(result, { status: 200 })
    } else {
      console.error('[cTrader Cron] Job failed:', result.error)
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error('[cTrader Cron] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'cTrader sync cron endpoint is ready',
    documentation: 'POST with Authorization header containing CRON_SECRET',
  })
}
