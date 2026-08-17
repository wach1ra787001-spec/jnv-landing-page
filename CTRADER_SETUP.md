# cTrader Integration Setup Guide

## Overview
This guide walks you through setting up the complete cTrader integration for JnV Pro trading journal.

## Step 1: Database Setup

Run this SQL in your Supabase console to create the `broker_connections` table:

```sql
CREATE TABLE broker_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker              TEXT NOT NULL,
  
  -- OAuth tokens
  access_token        TEXT,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  
  -- cTrader specific
  ctrader_account_id  BIGINT,
  account_login       TEXT,
  account_name        TEXT,
  broker_name         TEXT,
  is_live             BOOLEAN DEFAULT false,
  
  -- Sync state
  is_connected        BOOLEAN DEFAULT false,
  last_synced_at      TIMESTAMPTZ,
  last_sync_error     TEXT,
  sync_from_date      DATE,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_broker_per_user 
    UNIQUE (user_id, broker, ctrader_account_id)
);

ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own connections"
  ON broker_connections
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Step 2: Environment Variables

Add these to your `.env.local` file:

```env
CTRADER_CLIENT_ID=your_client_id_here
CTRADER_CLIENT_SECRET=your_client_secret_here
CTRADER_REDIRECT_URI=https://your-domain.com/api/ctrader/callback
CTRADER_AUTH_URL=https://connect.spotware.com/apps/auth
CTRADER_TOKEN_URL=https://connect.spotware.com/apps/token
CTRADER_API_BASE=https://api.spotware.com/connect
```

### Getting cTrader Credentials

1. Go to https://connect.spotware.com/apps
2. Register your application
3. Get your Client ID and Client Secret
4. Set the redirect URI to match your deployment URL

## Step 3: Integration Flow

### What's Already Implemented

- **API Routes**: 
  - `/api/ctrader/auth` - Initiates OAuth flow
  - `/api/ctrader/callback` - Handles OAuth callback
  - `/api/ctrader/sync` - Syncs trade history
  - `/api/ctrader/disconnect` - Disconnects account
  - `/api/ctrader/status` - Gets connection status

- **Components**:
  - Updated `BrokerTab` with cTrader connection UI
  - Sync button with error handling
  - Disconnect with confirmation

- **Utilities**:
  - `lib/ctrader.ts` - All cTrader API operations
  - `types/ctrader.ts` - TypeScript types

- **Database**:
  - `trades` table already has `ctrader_position_id`, `ctrader_deal_id`, `screenshot_urls` fields

### User Flow

1. User clicks "Connect" on cTrader in broker settings
2. Redirected to cTrader OAuth
3. User authorizes JnV Pro app
4. cTrader redirects back with auth code
5. App exchanges code for access/refresh tokens
6. App stores tokens in `broker_connections` table
7. Initial 90-day trade history is imported
8. User can manually sync or let auto-sync handle it

## Step 4: Testing

1. Update `.env.local` with cTrader credentials
2. Run `pnpm dev`
3. Navigate to Settings > Broker & Import
4. Click "Connect" on cTrader
5. Authorize the app
6. Account should appear as connected
7. Click "Sync Now" to import trades

## Step 5: Auto-Sync (Optional)

To enable automatic background syncing when users log in, add this to your dashboard layout (not yet implemented):

```typescript
useEffect(() => {
  const syncTrades = async () => {
    const res = await fetch('/api/ctrader/sync', { method: 'POST' })
    if (res.ok) {
      const { imported } = await res.json()
      if (imported > 0) {
        showToast(`${imported} new trades synced from cTrader`)
      }
    }
  }
  
  syncTrades()
}, [])
```

## API Reference

### GET /api/ctrader/auth
Initiates OAuth flow. Redirects to cTrader login.

### GET /api/ctrader/callback
Handles OAuth callback. Stores connection and imports trades.

Query params:
- `code` - Authorization code from cTrader
- `state` - CSRF token

### POST /api/ctrader/sync
Imports/updates trade history from cTrader.

Body: `{ accountId?: string }`

Response:
```json
{
  "imported": 142,
  "updated": 5,
  "errors": []
}
```

### POST /api/ctrader/disconnect
Disconnects cTrader account (keeps imported trades).

### GET /api/ctrader/status
Gets current connection status.

Response:
```json
{
  "id": "uuid",
  "broker": "ctrader",
  "is_connected": true,
  "account_login": "12345",
  "account_name": "My Account",
  "broker_name": "IC Markets",
  "is_live": true,
  "last_synced_at": "2024-06-01T10:30:00Z",
  "last_sync_error": null
}
```

## Troubleshooting

### "No accounts found" error
- Verify credentials are correct in cTrader
- Ensure cTrader API scope includes "trading" and "accounts"

### Trades not importing
- Check `broker_connections.last_sync_error` for details
- Verify token hasn't expired
- Check Supabase RLS policies on `trades` table

### CSRF state mismatch
- Cookies not being set properly
- Check secure/sameSite cookie settings for your domain

## Files Created

- `/types/ctrader.ts` - TypeScript interfaces
- `/lib/ctrader.ts` - Utility functions
- `/app/api/ctrader/auth/route.ts` - OAuth initiation
- `/app/api/ctrader/callback/route.ts` - OAuth callback
- `/app/api/ctrader/sync/route.ts` - Trade sync
- `/app/api/ctrader/disconnect/route.ts` - Disconnection
- `/app/api/ctrader/status/route.ts` - Status check
- Updated `/components/settings/broker-tab.tsx` - UI integration

## Next Steps

1. Create cTrader app at https://connect.spotware.com/apps
2. Add environment variables
3. Create `broker_connections` table in Supabase
4. Test the OAuth flow
5. Implement auto-sync in dashboard layout (optional)
