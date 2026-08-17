# Economic Calendar Data Pipeline - Implementation Guide

## Overview

This economic calendar data pipeline fetches economic events from external sources, stores them in Supabase, and keeps them updated automatically. The data is used in Advanced Statistics to correlate trades with news events in the **News Time Impact** card.

---

## System Architecture

### Data Flow

```
FMP API / ForexFactory RSS
           ↓
    /api/economic-calendar/sync (Daily 02:00 UTC)
           ↓
    Supabase economic_events table
           ↓
    /api/economic-calendar/update-actuals (Every 15 mins)
           ↓
    Update actual values when released
           ↓
    lib/economicCalendar.ts (Server-side utilities)
           ↓
    Advanced Statistics / News Time Impact Card
```

---

## Database Schema

The `economic_events` table stores all economic calendar data:

```sql
CREATE TABLE economic_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name      TEXT NOT NULL,          -- e.g., "Non-Farm Payroll"
  currency        CHAR(3) NOT NULL,       -- 'USD', 'EUR', 'GBP'
  impact          TEXT NOT NULL CHECK (impact IN ('high', 'medium', 'low', 'holiday')),
  event_time_utc  TIMESTAMPTZ NOT NULL,   -- When the event occurs
  
  -- Extended fields (nullable for flexibility)
  forecast        TEXT,                   -- Expected value e.g. "2.4%"
  actual          TEXT,                   -- Released value e.g. "2.8%"
  previous        TEXT,                   -- Prior period value
  revised         TEXT,                   -- Revised prior value
  surprise_pct    NUMERIC(8, 4),          -- (actual - forecast) / |forecast| * 100
  
  -- Source tracking
  source          TEXT DEFAULT 'fmp',
  source_id       TEXT,                   -- Provider's own event ID
  country         TEXT,                   -- Full country name
  
  -- Status
  is_released     BOOLEAN DEFAULT false,
  is_revised      BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Dedup constraint
  CONSTRAINT unique_event UNIQUE (source, source_id, event_time_utc)
);

-- Indexes for Advanced Statistics queries
CREATE INDEX idx_econ_events_time ON economic_events (event_time_utc);
CREATE INDEX idx_econ_events_currency ON economic_events (currency, event_time_utc);
CREATE INDEX idx_econ_events_impact ON economic_events (impact, event_time_utc);
CREATE INDEX idx_econ_events_released ON economic_events (is_released, event_time_utc);

-- Row-level security: all authenticated users can read
ALTER TABLE economic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "economic_events: authenticated read"
  ON economic_events FOR SELECT
  TO authenticated
  USING (true);
```

**Note:** The table was already created. The schema is here for reference.

---

## API Routes

### 1. `/api/economic-calendar/sync` (GET)

**Purpose:** Fetch upcoming economic events from Financial Modeling Prep (FMP) API  
**Schedule:** Daily at 02:00 UTC  
**Authorization:** Bearer token via `CRON_SECRET` header

**Process:**
1. Fetches events from FMP API for the next 30 days
2. Falls back to ForexFactory RSS if FMP fails
3. Upserts events into the database
4. Returns count of fetched/upserted events

**Response:**
```json
{
  "fetched": 150,
  "upserted": 145,
  "errors": [],
  "from": "2026-06-09",
  "to": "2026-07-09",
  "source": "trading_economics"
}
```

**Environment:**
- `TRADING_ECONOMICS_API_KEY`: Your TradingEconomics API key (free tier available)
- `CRON_SECRET`: Secret for securing cron jobs

---

### 2. `/api/economic-calendar/update-actuals` (GET)

**Purpose:** Update actual values for recently released events  
**Schedule:** Every 15 minutes during market hours  
**Authorization:** Bearer token via `CRON_SECRET` header

**Process:**
1. Finds unreleased events from the last 48 hours
2. Checks if actual values have been released
3. Updates `actual`, `is_released`, and `surprise_pct`
4. Returns count of updated events

**Response:**
```json
{
  "updated": 8
}
```

---

### 3. `/api/economic-calendar/events` (GET)

**Purpose:** Frontend endpoint for reading events  
**Authentication:** Authenticated users only

**Query Parameters:**
- `from` (optional): Start date (default: today)
- `to` (optional): End date (default: today + 7 days)
- `impact` (optional): 'high' | 'medium' | 'low'
- `currency` (optional): 'USD' | 'EUR' | etc.

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "event_name": "Non-Farm Payroll",
      "currency": "USD",
      "impact": "high",
      "event_time_utc": "2026-06-09T12:30:00Z",
      "forecast": "180K",
      "actual": null,
      "previous": "175K",
      "surprise_pct": null,
      "is_released": false,
      ...
    }
  ],
  "count": 23,
  "filters": {
    "impact": "high",
    "currency": "USD"
  }
}
```

---

## Cron Configuration

The `vercel.json` file schedules automatic syncs:

```json
{
  "crons": [
    {
      "path": "/api/economic-calendar/sync",
      "schedule": "0 2 * * *"        // Daily at 02:00 UTC
    },
    {
      "path": "/api/economic-calendar/update-actuals",
      "schedule": "*/15 * * * *"     // Every 15 minutes
    }
  ]
}
```

---

## Server-Side Utilities (`lib/economicCalendar.ts`)

All functions are marked with `'use server'` directive for server-only execution.

### `analyzeNewsImpact(trades, windowMinutes = 30)`

Analyzes how trades perform near economic releases vs. normal trading.

```typescript
const analysis = await analyzeNewsImpact(trades, 30);

// Returns:
{
  nearNews: {
    trades: [...],      // Trades within 30 mins of high-impact events
    winRate: 45.2,
    avgPnl: 125.50
  },
  normalTime: {
    trades: [...],      // Other trades
    winRate: 52.1,
    avgPnl: 89.75
  }
}
```

**Used by:** Advanced Statistics > Time Analysis > News Time Impact Card

### `tagTradesWithNews(trades, windowMinutes = 30)`

Tags each trade with its nearest economic event.

```typescript
const tagged = await tagTradesWithNews(trades);

// Each trade includes:
{
  ...trade,
  nearest_event: EconomicEvent | null,
  minutes_from_news: number | null,
  is_near_high_impact: boolean
}
```

### `getHighImpactEvents(from, to, currencies?)`

Fetch all high-impact events in a date range.

```typescript
const events = await getHighImpactEvents(
  new Date('2026-06-01'),
  new Date('2026-06-30'),
  ['USD', 'EUR']
);
```

### `getEventsNearTrade(tradeTime, windowMinutes = 30)`

Get all events within a time window of a specific trade.

```typescript
const events = await getEventsNearTrade(tradeTime);
// Returns events from (tradeTime - 30 mins) to (tradeTime + 30 mins)
```

### `getEventsByCurrency(currency, from, to)`

Fetch events for a specific currency.

```typescript
const events = await getEventsByCurrency('USD', from, to);
```

---

## Data Providers

### Primary: TradingEconomics API

**Signup:** https://tradingeconomics.com/api  
**Tier:** Free (limited), Pro (more events/history)  
**Fields Mapped:**
- `Category` → `event_name`
- `Currency` → `currency`
- `Importance` → `impact` (1=high, 2=medium, 3=low)
- `Date` → `event_time_utc`
- `Forecast`, `Actual`, `Previous`, `Revised` → respective fields

### Fallback: ForexFactory RSS

**URL:** https://nfs.faireconomy.media/ff_calendar_thisweek.xml  
**Tier:** Free (no key required)  
**Limitation:** Only current week's events

---

## Integration with Advanced Statistics

### News Time Impact Card

The **Time Analysis** page displays how trading near news affects performance:

```
┌─────────────────────────────────────────────┐
│           News Time Impact                  │
├──────────────────────┬──────────────────────┤
│  Trading Near News   │  Normal Trading      │
│  ─────────────────   │  ───────────────     │
│  Trades: 45          │  Trades: 180         │
│  Win Rate: 42.1%     │  Win Rate: 54.3%     │
│  P&L: +$1,250        │  P&L: +$3,890        │
├──────────────────────┴──────────────────────┤
│  Your win rate during news times is         │
│  12.2% lower compared to normal trading.    │
│  Consider avoiding trades near major events.│
└─────────────────────────────────────────────┘
```

**Data Flow:**
1. User navigates to `/dashboard/advanced-stats/time`
2. Server fetches all closed trades
3. Server calls `analyzeNewsImpact()` with 30-minute window
4. Results passed to client component
5. Client renders statistics

---

## Environment Variables

### Required

```bash
# Supabase (auto-configured)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cron jobs
CRON_SECRET=your_random_secret
```

### Optional

```bash
# External data provider
TRADING_ECONOMICS_API_KEY=your_api_key
```

**Generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

---

## Testing & Manual Triggers

### Verify Scheduled Syncs

Check Vercel project settings:
1. Go to **Settings** → **Cron Jobs**
2. Verify both jobs are enabled and scheduled
3. View execution logs

### Manual Sync (Testing)

```bash
# In browser console or via curl
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/economic-calendar/sync

# Response:
{
  "fetched": 150,
  "upserted": 145,
  "errors": [],
  "from": "2026-06-09",
  "to": "2026-07-09",
  "source": "trading_economics"
}
```

### Check Database

```sql
-- Count events
SELECT COUNT(*) FROM economic_events;

-- View latest events
SELECT event_name, currency, impact, event_time_utc, is_released
FROM economic_events
WHERE event_time_utc > NOW()
ORDER BY event_time_utc ASC
LIMIT 10;

-- Find high-impact USD events
SELECT event_name, event_time_utc, forecast, actual, is_released
FROM economic_events
WHERE currency = 'USD' 
  AND impact = 'high'
  AND event_time_utc > NOW()
ORDER BY event_time_utc ASC;
```

---

## How It's Used in News Time Impact

### Query Example (from Advanced Statistics)

```typescript
// In app/dashboard/advanced-stats/time/page.tsx

const analysis = await analyzeNewsImpact(trades, 30);

// nearNews = trades within 30 mins of high-impact events
// normalTime = all other trades

// Calculate stats
const nearNewsStats = {
  trades: analysis.nearNews.trades.length,
  wins: analysis.nearNews.trades.filter(t => t.net_pnl > 0).length,
  losses: analysis.nearNews.trades.filter(t => t.net_pnl < 0).length,
  winRate: analysis.nearNews.winRate,
  pnl: total_pnl_of_near_news_trades
}
```

### Display in Card

```typescript
<NewsTimeImpactCard
  nearNews={nearNewsStats}
  normalTime={normalTimeStats}
/>
```

---

## Performance Considerations

### Indexing

The table includes 4 indexes for common queries:
- `event_time_utc` - for date range queries
- `currency, event_time_utc` - for currency-filtered queries
- `impact, event_time_utc` - for importance-filtered queries
- `is_released, event_time_utc` - for finding unreleased events

### Caching Strategy

- Cron job runs at 02:00 UTC to avoid market hours
- Updates run every 15 minutes (market hours)
- Frontend queries can be cached (RLS = read-only for users)

### Database Impact

- **Growth:** ~150 events every 30 days = ~4,500 events/year
- **Storage:** ~1 MB/year (with indices)
- **Queries:** O(log n) due to indexes

---

## Troubleshooting

### No Events Appearing

1. **Check CRON_SECRET is set** in Vercel project settings
2. **Verify API key** in TradingEconomics dashboard
3. **Check cron execution** in Vercel logs
4. **Query database** to see if events exist

```sql
SELECT COUNT(*) FROM economic_events WHERE created_at > NOW() - INTERVAL '1 day';
```

### Actual Values Not Updating

1. **Cron job disabled?** Check `vercel.json` schedule
2. **Past events?** Update cron only checks last 48 hours
3. **API key inactive?** Re-check TradingEconomics settings

### News Impact Card Shows No Data

1. **No closed trades?** User must have completed trades
2. **Trades all before any events?** Check date ranges
3. **No high-impact events?** Try wider date range

---

## Files Created/Modified

### New Files
- `types/economic.ts` - TypeScript interfaces
- `lib/economicCalendar.ts` - Server-side utilities
- `lib/forexFactoryFallback.ts` - RSS fallback parser
- `app/api/economic-calendar/sync/route.ts` - Sync API
- `app/api/economic-calendar/update-actuals/route.ts` - Update API
- `app/api/economic-calendar/events/route.ts` - Read API
- `vercel.json` - Cron configuration

### Modified Files
- `lib/time-analysis-utils.ts` - Removed hardcoded news times
- `app/dashboard/advanced-stats/time/page.tsx` - Added news impact analysis
- `components/advanced-stats/TimeAnalysisClient.tsx` - Accept news data as prop

---

## Next Steps

1. **Add TRADING_ECONOMICS_API_KEY** to Vercel environment variables
2. **Add CRON_SECRET** to Vercel environment variables
3. **Deploy to Vercel** to activate cron jobs
4. **Wait for sync** at next scheduled time (02:00 UTC)
5. **Test with trades** - Navigate to Advanced Stats > Time Analysis

---

## Version

- **Implementation Date:** 2026-06-09
- **Schema:** economic_events v1
- **API Version:** v1
- **Status:** Production Ready
