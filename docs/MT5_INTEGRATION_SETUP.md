# MT5 Integration Setup Guide

This guide walks through setting up the complete MT5 → Backend → Frontend pipeline.

## Architecture Overview

```
MT5 Terminal (EA)
    ↓ HTTPS + WebRequest
Node.js Bridge (/ea/auth, /ea/ping, /ea/events)
    ↓
Supabase PostgreSQL (mt5_events, mt5_connections, etc.)
    ↓
Async Workers (event processors)
    ↓
Frontend (real-time dashboard + journal)
```

## Step 1: Database Setup

1. Run the migration to create MT5 tables:

```bash
# Using Supabase CLI
supabase migration up

# Or manually execute migrations/001_mt5_events.sql in Supabase dashboard
```

The migration creates these tables:
- `mt5_events` - Raw events from the EA (with deduplication on `(account_login, seq)`)
- `mt5_connections` - Track connected MT5 accounts
- `mt5_sessions` - Auth tokens for EA communication
- `mt5_account_snapshots` - Account state history
- `mt5_symbol_specs` - Symbol metadata
- `mt5_trade_ohlc` - Broker OHLC around trades
- `mt5_processed_trades` - Derived trade records for journal

## Step 2: Environment Variables

Add these to your `.env.local` and deploy to Vercel:

```env
# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# MT5 Bridge Configuration
MT5_EA_API_KEY=your-shared-secret-here-change-this
MT5_BRIDGE_BASE_URL=https://yourdomain.com  # Your deployed Next.js URL

# Optional: For production, set proper hostname
VERCEL_URL=yourdomain.com
```

## Step 3: API Endpoints

Three endpoints are now active:

### POST `/api/ea/auth`
**Request:**
```json
{
  "ea_api_key": "your-shared-secret-here",
  "jnv_user_id": "user-123",
  "account_login": 12345678,
  "account_server": "Broker-Live01",
  "broker": "MetaQuotes-Demo",
  "terminal_build": 4530,
  "ea_version": 100,
  "currency": "USD",
  "terminal_id": "mt5-12345678"
}
```

**Response:**
```json
{
  "token": "opaque-session-token-here",
  "expires_in": 3600
}
```

### POST `/api/ea/ping`
Simple heartbeat check. EA uses this to measure latency.

### POST `/api/ea/events`
Accepts all event types from the EA.

**Headers:**
```
Authorization: Bearer <token-from-auth>
X-EA-Api-Key: your-shared-secret-here
Content-Type: application/json
```

**Request:**
```json
{
  "seq": 4821,
  "event_type": "position_closed",
  "jnv_user_id": "user-123",
  "terminal_id": "mt5-12345678",
  "account_login": 12345678,
  "sent_at": "2026-07-03T06:12:45Z",
  "payload": { "...": "event-specific fields" }
}
```

## Step 4: MT5 EA Configuration

In MetaTrader 5, attach the `JNVBridgeEA.mq5` to any chart and set inputs:

```
InpBridgeBaseUrl      = https://yourdomain.com
InpEaApiKey           = your-shared-secret-here
InpJnvUserId          = user-123
InpTerminalId         = (leave blank to auto-generate from account login)
InpHeartbeatSeconds   = 15
InpAccountSnapshotSeconds = 30
InpPositionsSyncSeconds = 20
InpHistorySyncSeconds = 120
InpTradeOhlcTimeframes = H1,M15,M5
```

**Important:** Add your domain to MT5's WebRequest whitelist:
- Tools → Options → Expert Advisors → Allow WebRequest for listed URL
- Add: `https://yourdomain.com` (no trailing slash)

## Step 5: Async Event Processing

Events are processed asynchronously. The processor reads from `mt5_events` and:

1. **Extracts metadata** - Symbol specs, account snapshots
2. **Correlates trades** - Links `position_opened` → `position_closed` events
3. **Stores processed trades** - Writes to `mt5_processed_trades` for journal
4. **Attaches OHLC** - Stores broker candles for replay

To trigger event processing:

**Option A: API Route (recommended for serverless)**
```typescript
// app/api/mt5/process-events/route.ts
import { batchProcessEvents } from '@/lib/mt5/event-processors'

export async function POST() {
  await batchProcessEvents()
  return Response.json({ ok: true })
}
```

Then set up a cron job (Vercel, AWS Lambda, or your deployment):
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/mt5/process-events",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Option B: Long-running worker**
```typescript
// In a separate worker service or scheduled task
setInterval(async () => {
  await batchProcessEvents()
}, 5 * 60 * 1000) // Every 5 minutes
```

## Step 6: Frontend Integration

### Display MT5 Dashboard
```tsx
import { MT5Dashboard } from '@/components/mt5-dashboard'

export default function Page() {
  return <MT5Dashboard />
}
```

### Use Hooks for Custom Displays
```tsx
import { 
  useMT5Connections, 
  useMT5Trades, 
  useMT5AccountSnapshot 
} from '@/lib/mt5/client'

export function MyComponent() {
  const { connections } = useMT5Connections()
  const { trades } = useMT5Trades({ status: 'closed' })
  const { snapshot } = useMT5AccountSnapshot(connectionId)
  
  // Use data in your component...
}
```

### Calculate Metrics
```tsx
import { calculateMT5TradeMetrics } from '@/lib/mt5/dashboard'

const metrics = await calculateMT5TradeMetrics(userId)
console.log(metrics.win_rate_pct, metrics.profit_factor, metrics.expectancy)
```

## Step 7: Deduplication & Retry Logic

The system handles:

1. **Duplicate events** - If EA retries a send, the `(account_login, seq)` unique constraint prevents duplicate inserts
2. **Out-of-order delivery** - Sequence numbers detect gaps; workers process in order
3. **Token expiry** - EA gets new token if 401 received; frontend shows connection status
4. **Offline queue** - EA queues events to disk if bridge unreachable; replays when online

## Testing Checklist

- [ ] Database migration ran successfully
- [ ] Environment variables are set in Vercel
- [ ] EA connects and gets token from `/api/ea/auth`
- [ ] First heartbeat arrives in `mt5_events` table
- [ ] Event processor runs and creates `mt5_processed_trades` records
- [ ] Dashboard component displays live data
- [ ] Real-time subscriptions update as new events arrive
- [ ] Connection status shows as "Connected"

## Troubleshooting

### EA won't connect (WebRequest error 4060)
- Add domain to MT5 WebRequest whitelist (Tools → Options → Expert Advisors)
- Check InpBridgeBaseUrl is exactly correct (no trailing slash)
- Verify domain is HTTPS in production

### Events queuing but not processing
- Check `/api/mt5/process-events` cron is running
- Verify `processed_at` column is being updated
- Check browser console for React/hook errors

### No trades appearing in dashboard
- Confirm `position_opened` and `position_closed` events arrived in `mt5_events`
- Check event processor logic in `lib/mt5/event-processors.ts`
- Verify RLS policies allow read access

### Token expired error
- Normal behavior - EA auto-refreshes tokens every hour
- Check `mt5_sessions.expires_at` table

## Production Deployment

1. Deploy Next.js to Vercel
2. Update MT5 EA `InpBridgeBaseUrl` to your production domain
3. Change `MT5_EA_API_KEY` environment variable to a strong random value
4. Set up cron for event processing (see Step 5)
5. Monitor `/api/ea/events` endpoint latency (should be <100ms)
6. Set up alerting for failed authentications in logs

## Performance Notes

- **Heartbeat latency** - Measure in dashboard; typically 50-200ms
- **Event ingestion** - `/api/ea/events` should complete in <50ms
- **Async processing** - 100 events per batch; tune based on load
- **Real-time updates** - Supabase subscriptions have <1s latency
- **Database** - Indexes on (account_login, seq), user_id, event_type for fast queries
