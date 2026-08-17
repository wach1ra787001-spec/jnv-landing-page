'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { appToast } from '@/lib/toast-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Hook to listen for real-time trade imports via Supabase realtime
 * Shows in-app toast notification when a new trade is imported
 */
export function useTradeImportNotifications() {
  const router = useRouter()

  useEffect(() => {
    // Subscribe to notification_logs table for new in-app notifications
    const channel = supabase
      .channel('trade-imports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `channel=eq.in_app AND status=eq.sent`,
        },
        async (payload) => {
          try {
            // Fetch trade details to show in toast
            const { data: trade } = await supabase
              .from('trades')
              .select('id, symbol, entry_time')
              .eq('id', payload.new.trade_id)
              .single()

            if (trade) {
              // Show toast with action to navigate to trade
              appToast.tradeImported(trade.symbol, trade.id, () => {
                router.push(`/dashboard/trade-detail/${trade.id}`)
              })
            }
          } catch (error) {
            console.error('[Notifications] Error processing trade import:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])
}

/**
 * Alternative: Subscribe to trades table directly for new inserts
 * Useful if you want to show notifications for all new trades
 */
export function useAllTradeNotifications() {
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel('all-trades')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `source=eq.mt5`, // Only MT5 trades
        },
        async (payload) => {
          const trade = payload.new
          appToast.tradeImported(trade.symbol, trade.id, () => {
            router.push(`/dashboard/trade-detail/${trade.id}`)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])
}
