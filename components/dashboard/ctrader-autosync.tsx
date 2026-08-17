'use client'

import { useEffect, useRef } from 'react'
import { appToast } from '@/lib/toast-utils'

export function CTraderAutoSync() {
  const syncedRef = useRef(false)

  useEffect(() => {
    // Only sync once per session
    if (syncedRef.current) return
    syncedRef.current = true

    const performAutoSync = async () => {
      try {
        // Get current connection status
        const statusResponse = await fetch('/api/ctrader/status')
        if (!statusResponse.ok) return

        const connection = await statusResponse.json()
        if (!connection || !connection.is_connected) return

        // Check if last sync was more than 30 minutes ago
        const lastSyncTime = connection.last_synced_at
          ? new Date(connection.last_synced_at).getTime()
          : 0
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000

        if (lastSyncTime > thirtyMinutesAgo) {
          // Recently synced, skip
          return
        }

        // Trigger background sync
        const syncResponse = await fetch('/api/ctrader/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })

        if (syncResponse.ok) {
          const result = await syncResponse.json()
          if (result.imported > 0) {
            appToast.success(
              `${result.imported} new trade${result.imported === 1 ? '' : 's'} synced from cTrader`
            )
          }
        }
      } catch (error) {
        // Silently fail - don't disturb user with background sync errors
        console.error('[cTrader AutoSync] Background sync failed:', error)
      }
    }

    // Delay sync slightly to not block initial render
    const timer = setTimeout(performAutoSync, 1000)
    return () => clearTimeout(timer)
  }, [])

  return null
}
