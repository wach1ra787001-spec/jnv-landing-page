import { createClient } from '@supabase/supabase-js'
import { sendTradeImportedEmail } from '@/lib/email/resend-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TradeImportedEventData {
  tradeId: string
  userId: string
  symbol: string
  direction: 'buy' | 'sell'
  entryPrice: number
  entryTime: string
  connectionId: string
}

/**
 * Main handler for new trade imports
 * Sends both in-app toast notification and email
 * Runs asynchronously to avoid blocking MT5 imports
 */
export async function handleTradeImported(data: TradeImportedEventData) {
  console.log(`[Notification] Processing trade imported event for trade ${data.tradeId}`)

  try {
    // Check if notification already exists for this trade
    const { data: existingNotification } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('trade_id', data.tradeId)
      .eq('notification_type', 'trade_imported')
      .single()

    if (existingNotification) {
      console.log(`[Notification] Notification already sent for trade ${data.tradeId}`)
      return { success: false, reason: 'Duplicate notification' }
    }

    // Fetch user details
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name, notify_mt5_imports')
      .eq('id', data.userId)
      .single()

    if (profileError || !userProfile) {
      console.error(`[Notification] User profile not found for ${data.userId}`, profileError)
      return { success: false, reason: 'User profile not found' }
    }

    const { email, full_name, notify_mt5_imports } = userProfile

    // Format trade date
    const tradeDate = new Date(data.entryTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const tradeDateKey = new Date(data.entryTime).toISOString().slice(0, 10)
    const { data: userTrades } = await supabase.from('trades').select('entry_time').eq('user_id', data.userId).order('entry_time', { ascending: true })
    const firstTradingDay = userTrades?.[0]?.entry_time ? new Date(userTrades[0].entry_time).toISOString().slice(0, 10) === tradeDateKey : true
    const notificationTitle = 'New trade ready to journal'
    const notificationMessage = `${data.symbol} was pulled from your trading account. Click to journal this trade.`

    const { error: logError } = await supabase.from('notification_logs').insert({
      user_id: data.userId, trade_id: data.tradeId, notification_type: 'trade_imported', channel: 'in_app', status: 'sent',
      title: notificationTitle, message: notificationMessage, href: '/dashboard/journal',
    })

    if (logError) {
      console.error(`[Notification] Failed to create in-app notification log:`, logError)
    }

    // Send one email on the user's first trading day; in-app notifications are always created.
    const { count: firstDayEmailCount } = await supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('user_id', data.userId).eq('notification_type', 'first_trading_day_trade_imported').eq('channel', 'email')
    if (notify_mt5_imports !== false && firstTradingDay && (firstDayEmailCount || 0) === 0) {
      try {
        // Create email notification log entry
        await supabase.from('notification_logs').insert({
          user_id: data.userId,
          trade_id: data.tradeId,
          notification_type: 'first_trading_day_trade_imported',
          channel: 'email',
          status: 'pending',
        })

        await sendTradeImportedEmail({
          userEmail: email,
          userName: full_name || 'Trader',
          symbol: data.symbol,
          direction: data.direction,
          entryPrice: data.entryPrice,
          tradeDate,
          tradeId: data.tradeId,
        })
        await supabase
          .from('notification_logs')
          .update({ status: 'sent' })
          .eq('trade_id', data.tradeId)
          .eq('notification_type', 'first_trading_day_trade_imported')
          .eq('channel', 'email')
        console.log(`[Notification] Email sent successfully for trade ${data.tradeId}`)
      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error'
        console.error(`[Notification] Email failed for trade ${data.tradeId}:`, errorMessage)
        await supabase.from('notification_logs').update({ status: 'failed', error_message: errorMessage }).eq('trade_id', data.tradeId).eq('notification_type', 'first_trading_day_trade_imported').eq('channel', 'email')
      }
    }

    return {
      success: true,
      reason: 'Notifications queued',
      inAppSent: true,
      emailQueued: notify_mt5_imports !== false,
    }
  } catch (error) {
    console.error(`[Notification] Error handling trade imported event:`, error)
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Retry failed email notifications
 * Can be called periodically via a cron job
 */
export async function retryFailedEmailNotifications() {
  console.log('[Notification] Attempting to retry failed email notifications...')

  try {
    // Find failed email notifications from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: failedNotifications, error } = await supabase
      .from('notification_logs')
      .select('id, user_id, trade_id, error_message')
      .eq('channel', 'email')
      .eq('status', 'failed')
      .gt('created_at', oneDayAgo)

    if (error) {
      console.error('[Notification] Failed to fetch failed notifications:', error)
      return
    }

    if (!failedNotifications || failedNotifications.length === 0) {
      console.log('[Notification] No failed notifications to retry')
      return
    }

    console.log(`[Notification] Retrying ${failedNotifications.length} failed notifications`)

    // Retry each failed notification
    for (const notification of failedNotifications) {
      try {
        // Fetch the trade details
        const { data: trade } = await supabase
          .from('trades')
          .select('symbol, direction, entry_price, entry_time')
          .eq('id', notification.trade_id)
          .single()

        if (!trade) {
          console.warn(
            `[Notification] Trade not found for notification retry: ${notification.trade_id}`
          )
          continue
        }

        // Fetch user profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', notification.user_id)
          .single()

        if (!userProfile) {
          console.warn(
            `[Notification] User profile not found for notification retry: ${notification.user_id}`
          )
          continue
        }

        // Retry sending email
        const tradeDate = new Date(trade.entry_time).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        await sendTradeImportedEmail({
          userEmail: userProfile.email,
          userName: userProfile.full_name || 'Trader',
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice: trade.entry_price,
          tradeDate,
          tradeId: notification.trade_id,
        })

        // Mark as sent
        await supabase
          .from('notification_logs')
          .update({ status: 'sent', error_message: null })
          .eq('id', notification.id)

        console.log(`[Notification] Retried email for trade ${notification.trade_id}`)
      } catch (retryError) {
        console.error(
          `[Notification] Failed to retry notification ${notification.id}:`,
          retryError
        )
      }
    }

    console.log('[Notification] Email retry completed')
  } catch (error) {
    console.error('[Notification] Error in retry process:', error)
  }
}
