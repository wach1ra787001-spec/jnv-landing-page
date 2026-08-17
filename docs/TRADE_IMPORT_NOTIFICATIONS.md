# Trade Import Notification System

This document describes the automated "Journal Your Trade" notification system that triggers when new MT5 trades are imported.

## Overview

When a new trade is successfully imported from MT5:

1. **In-app Toast Notification** - Immediately displays a success toast with a "Journal Trade" button
2. **Email Notification** - Sends a branded email via Resend (respects user preferences)
3. **Notification Log** - Tracks all notifications to prevent duplicates

## Architecture

```
MT5 EA
  ↓
Bridge API (/api/ea/events)
  ↓
Event Processor (processPositionOpened)
  ↓
Trade stored in database
  ↓
handleTradeImported() triggered
  ↓
notification_logs table checked (deduplication)
  ↓
In-app notification logged (marked sent immediately)
  ↓
Email queued asynchronously
  ↓
Resend API (background job)
```

## Setup Instructions

### 1. Database Migration

Run the migration to create notification tables:

```bash
# In Supabase SQL Editor
psql $DATABASE_URL < migrations/002_notification_system.sql
```

This creates:
- `notification_logs` table for tracking notifications
- `notify_mt5_imports` preference column in `profiles` table

### 2. Environment Variables

Ensure these are set in your `.env.local` and Vercel:

```env
# Resend (for email)
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=noreply@jnvpro.com

# For cron job protection
CRON_SECRET=your_secure_random_string

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://jnvpro.com
```

### 3. Dependencies

Ensure Resend is installed:

```bash
pnpm add resend
```

### 4. Frontend Setup

Add the notification hook to your main layout or dashboard:

```tsx
'use client'

import { useTradeImportNotifications } from '@/hooks/use-trade-import-notifications'

export default function DashboardLayout({ children }) {
  // Listen for real-time trade import notifications
  useTradeImportNotifications()

  return <>{children}</>
}
```

### 5. Cron Job for Email Retries

Set up a periodic cron job to retry failed email notifications.

#### Using Vercel Crons

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/retry-emails",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

#### Using External Cron Service

Create a cron job that sends a POST request every 15 minutes:

```
POST https://yourdomain.com/api/notifications/retry-emails
Authorization: Bearer YOUR_CRON_SECRET
```

## Features

### Deduplication

The system prevents duplicate notifications by:

1. Checking `notification_logs` before sending
2. Using a unique constraint on `(user_id, trade_id, notification_type, channel)`
3. Tracking each notification's status independently

### User Preferences

Users can disable email notifications via their profile preferences:

- Email notifications are **enabled by default** (`notify_mt5_imports = true`)
- Users can toggle this in Settings → Preferences
- In-app toast notifications always show (regardless of preference)

### Email Template

Dynamic variables in email:

- `{{userName}}` - User's full name
- `{{symbol}}` - Trading symbol (e.g., "EURUSD")
- `{{direction}}` - Trade direction (BUY/SELL)
- `{{entryPrice}}` - Entry price
- `{{tradeDate}}` - Formatted trade date
- `{{tradeId}}` - Trade ID for deep-linking

Subject line: `New {{symbol}} Trade Ready to Journal`

### Toast Notification

- **Title:** "New Trade Imported"
- **Message:** Shows symbol and journal reminder
- **Button:** "Journal Trade" - navigates to `/dashboard/trade-detail/{tradeId}`
- **Duration:** 8-second auto-dismiss (manually dismissible)

### Error Handling

If email delivery fails:

1. Error is logged with reason in `notification_logs.error_message`
2. Status is marked as "failed"
3. Trade import succeeds (email doesn't block trades)
4. Automatic retry via `/api/notifications/retry-emails` within 24 hours

## Database Schema

### notification_logs table

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  trade_id UUID REFERENCES trades(id),
  notification_type TEXT, -- 'trade_imported'
  status TEXT, -- 'pending', 'sent', 'failed'
  channel TEXT, -- 'in_app', 'email'
  error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, trade_id, notification_type, channel)
);
```

### profiles table additions

```sql
ALTER TABLE profiles ADD COLUMN notify_mt5_imports BOOLEAN DEFAULT TRUE;
```

## API Endpoints

### Retry Failed Emails

**POST** `/api/notifications/retry-emails`

Requires: `Authorization: Bearer {CRON_SECRET}`

Retries failed email notifications from the last 24 hours.

```bash
curl -X POST https://yourdomain.com/api/notifications/retry-emails \
  -H "Authorization: Bearer your_cron_secret"
```

## Code Flow

### 1. When MT5 Trade is Imported

```typescript
// In lib/mt5/event-processors.ts
export async function processPositionOpened(event: MT5Event) {
  // Store trade...
  const { data: trade } = await supabase
    .from('mt5_processed_trades')
    .insert({...})
    .select('id')

  // Emit notification event (async, non-blocking)
  if (trade?.id) {
    handleTradeImported({
      tradeId: trade.id,
      userId: event.user_id,
      symbol,
      direction,
      entryPrice: price,
      entryTime: time,
      connectionId: connection.id,
    }).catch(err => console.error('Notification error:', err))
  }
}
```

### 2. Notification Handler

```typescript
// In lib/notifications/trade-import-handler.ts
export async function handleTradeImported(data: TradeImportedEventData) {
  // 1. Check for existing notification (deduplication)
  const existingNotification = await supabase
    .from('notification_logs')
    .select('id')
    .eq('trade_id', data.tradeId)
    .eq('notification_type', 'trade_imported')

  if (existingNotification.data?.length) {
    return { success: false, reason: 'Duplicate' }
  }

  // 2. Fetch user details
  const userProfile = await supabase
    .from('profiles')
    .select('email, full_name, notify_mt5_imports')

  // 3. Log in-app notification (sent immediately)
  await supabase.from('notification_logs').insert({
    user_id, trade_id, channel: 'in_app', status: 'sent'
  })

  // 4. Queue email asynchronously (if enabled)
  if (userProfile.notify_mt5_imports) {
    sendTradeImportedEmail({...}).catch(err => {
      // Log error, but don't throw
      supabase.from('notification_logs').update({
        status: 'failed',
        error_message: err.message
      })
    })
  }
}
```

### 3. Frontend Real-time Display

```typescript
// In hooks/use-trade-import-notifications.ts
export function useTradeImportNotifications() {
  useEffect(() => {
    // Subscribe to notification_logs INSERT events
    supabase
      .channel('trade-imports')
      .on('postgres_changes', {
        event: 'INSERT',
        table: 'notification_logs',
        filter: 'channel=eq.in_app AND status=eq.sent'
      }, (payload) => {
        // Fetch trade and show toast
        appToast.tradeImported(symbol, tradeId, () => {
          router.push(`/dashboard/trade-detail/${tradeId}`)
        })
      })
      .subscribe()
  }, [])
}
```

## Settings UI

Add to user preferences page:

```tsx
<div className="space-y-3">
  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={preferences.notify_mt5_imports}
      onChange={(e) => updatePreference('notify_mt5_imports', e.target.checked)}
    />
    <span>Email me when new MT5 trades are imported</span>
  </label>
  <p className="text-sm text-muted-foreground">
    In-app toast notifications will always appear. Email notifications are optional.
  </p>
</div>
```

## Troubleshooting

### Notifications not appearing

1. **Check database migration**: Verify `notification_logs` table exists
2. **Check Resend config**: Ensure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set
3. **Check user preference**: Verify `profiles.notify_mt5_imports = true`
4. **Check logs**: Look for errors in the backend logs

### Duplicate notifications

1. Check `notification_logs` for entries with same `trade_id`
2. Verify unique constraint exists: `UNIQUE(user_id, trade_id, notification_type, channel)`

### Email not received

1. Check `notification_logs.status` for that trade
2. If "failed", see `error_message` column
3. Verify email address in `profiles.email`
4. Check Resend dashboard for delivery status
5. Automatic retry happens every 15 minutes

## Performance Notes

- Notification handler runs asynchronously (non-blocking)
- Email sending happens in background worker
- MT5 imports are never delayed by email operations
- Batch email retry runs every 15 minutes (configurable)
- In-app toast uses Supabase realtime (no polling)

## Future Extensibility

The system is designed for easy channel expansion:

```typescript
// Add new channels by extending handleTradeImported():
await supabase.from('notification_logs').insert({
  user_id, trade_id,
  channel: 'push_notification', // or 'sms', 'discord', etc.
  status: 'pending'
})

sendPushNotification({...}) // or other channels
```

Each channel can have its own preferences and retry logic.
