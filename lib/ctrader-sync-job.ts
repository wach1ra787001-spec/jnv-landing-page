import { createClient } from '@/lib/supabase/server'

/**
 * Automatic sync job for cTrader connections
 * This should be called by a cron job service (e.g., Vercel Cron, EasyCron, or internal scheduler)
 */
export async function syncCTraderAccounts() {
  const supabase = await createClient()

  try {
    // Get all active cTrader connections
    const { data: connections, error: fetchError } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('broker', 'ctrader')
      .eq('is_connected', true)

    if (fetchError) {
      console.error('[cTrader Sync Job] Fetch error:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!connections?.length) {
      console.log('[cTrader Sync Job] No active connections to sync')
      return { success: true, synced: 0 }
    }

    let successCount = 0
    let errorCount = 0
    const errors: Record<string, string> = {}

    // Sync each connection
    for (const connection of connections) {
      try {
        console.log(`[cTrader Sync Job] Syncing connection ID: ${connection.id}`)

        // Call the sync endpoint
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/ctrader/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
          },
          body: JSON.stringify({
            connectionId: connection.id,
            userId: connection.user_id,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`[cTrader Sync Job] Synced ${result.imported} trades for connection ${connection.id}`)
          successCount++
        } else {
          const error = await response.json()
          console.error(`[cTrader Sync Job] Sync failed for connection ${connection.id}:`, error)
          errors[connection.id] = error.error || 'Unknown error'
          errorCount++
        }
      } catch (error) {
        console.error(`[cTrader Sync Job] Error syncing connection ${connection.id}:`, error)
        errors[connection.id] = error instanceof Error ? error.message : 'Unknown error'
        errorCount++
      }
    }

    console.log(`[cTrader Sync Job] Complete - Synced: ${successCount}, Errors: ${errorCount}`)
    return { success: true, synced: successCount, errors: errorCount, details: errors }
  } catch (error) {
    console.error('[cTrader Sync Job] Fatal error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
