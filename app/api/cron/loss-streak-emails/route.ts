import { NextRequest, NextResponse } from 'next/server'
import { sendActiveLossStreakEmails } from '@/lib/notifications/loss-streak-email-job'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await sendActiveLossStreakEmails()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[v0] Loss streak email cron failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cron failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Loss streak email cron endpoint is ready' })
}
