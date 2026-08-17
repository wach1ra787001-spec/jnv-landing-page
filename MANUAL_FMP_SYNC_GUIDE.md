# Manual FMP Economic Data Sync Guide

## Overview

This guide explains how to manually fetch economic calendar data from Financial Modeling Prep (FMP) for the next 30 days and save it to your Supabase database.

The script fetches high-impact indicators (CPI, NFP, ISM, etc.) for all major currency pairs (USD, EUR, GBP, JPY, CAD, AUD, CHF, etc.).

## Prerequisites

1. **FMP API Key** - Get free key from https://site.financialmodelingprep.com/developer/docs/
2. **Supabase Credentials**:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for backend access)

## Setup Steps

### Option 1: Using Environment Variables (Recommended for Local Development)

1. **Create `.env.local` in project root:**

```bash
FMP_API_KEY=your_fmp_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Run the fetch script:**

```bash
cd /path/to/project
node scripts/fetch-fmp-economic-data.mjs
```

### Option 2: Using Vercel Environment Variables (For Production)

1. **Add to Vercel Settings:**
   - Go to project → Settings → Environment Variables
   - Add the three variables above
   - Redeploy

2. **Manually trigger sync:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/economic-calendar/sync
```

### Option 3: Using Programmatic Fetch

If you prefer to call the API directly:

```typescript
import { detectTradeSession } from '@/lib/session-detection-engine'

// Call the sync endpoint with Bearer token
const response = await fetch('/api/economic-calendar/sync', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
})

const result = await response.json()
console.log(`Fetched: ${result.fetched}, Upserted: ${result.upserted}`)
```

## What Gets Fetched

The script automatically fetches **high-impact economic events** for:

### Major Economic Indicators
- **CPI** (Consumer Price Index) - Inflation measure
- **NFP** (Non-Farm Payroll) - Employment report
- **ISM Manufacturing PMI** - Manufacturing activity
- **ISM Services PMI** - Services activity
- **ADP Employment Report** - Private sector jobs
- **Initial Jobless Claims** - Weekly unemployment
- **Retail Sales** - Consumer spending
- **Housing Starts** - Construction activity
- **Building Permits** - Future construction
- **Consumer Confidence** - Economic sentiment
- **Factory Orders** - Manufacturing demand

### Major Currency Pairs
- **USD** (United States)
- **EUR** (Eurozone)
- **GBP** (United Kingdom)
- **JPY** (Japan)
- **CAD** (Canada)
- **AUD** (Australia)
- **CHF** (Switzerland)
- **SEK** (Sweden)
- **CNY** (China)
- **MXN** (Mexico)
- **NZD** (New Zealand)

## Data Saved

Each event is stored with:

```
{
  event_name: "CPI m/m",
  currency: "USD",
  impact: "high|medium|low",
  event_time_utc: "2024-06-15T12:30:00Z",
  forecast: 0.3,
  actual: null,  // Filled in when event occurs
  previous: 0.4,
  revised: null,  // Updated if revised
  surprise_pct: null,  // Calculated after actual released
  source: "fmp",
  country: "USA",
  is_released: false,
  is_revised: false,
  created_at: "2024-06-09T...",
  updated_at: "2024-06-09T..."
}
```

## Running the Script

### Command Line

```bash
node scripts/fetch-fmp-economic-data.mjs
```

### Expected Output

```
[FMP Sync] Fetching economic events from 2024-06-09 to 2024-07-09
[FMP Sync] Using API Key: abcdef1234...
[FMP Sync] Requesting: https://financialmodelingprep.com/api/v3/economic-calendar?...
[FMP Sync] Received 500 events from FMP
[FMP Sync] Filtered to 187 high-impact events for major pairs
[FMP Sync] Events by indicator:
  - CPI: 45 events
  - NFP: 12 events
  - ISM: 8 events
  - ... (more indicators)
[FMP Sync] Upserting 187 events to database...
[FMP Sync] Processing batch 1/4...
[FMP Sync] Processing batch 2/4...
[FMP Sync] Processing batch 3/4...
[FMP Sync] Processing batch 4/4...
[FMP Sync] ✓ Successfully saved 187 events to database

[FMP Sync] Summary:
  - Total events fetched: 500
  - High-impact events: 187
  - Successfully saved: 187
  - Date range: 2024-06-09 to 2024-07-09
  - Total FMP events in database: 187
```

## Verifying the Data

### Check via SQL

```sql
-- Count all FMP events
SELECT COUNT(*) FROM economic_events WHERE source = 'fmp';

-- View recent high-impact events
SELECT 
  event_name, 
  currency, 
  impact, 
  event_time_utc, 
  forecast, 
  actual 
FROM economic_events 
WHERE source = 'fmp' 
  AND impact = 'high' 
ORDER BY event_time_utc 
LIMIT 20;

-- Group by indicator
SELECT 
  event_name, 
  COUNT(*) as count,
  MIN(event_time_utc) as first_event,
  MAX(event_time_utc) as last_event
FROM economic_events 
WHERE source = 'fmp' 
GROUP BY event_name 
ORDER BY count DESC;
```

### Check via Dashboard

1. Go to **Dashboard → Advanced Stats → Time Analysis**
2. Scroll to **News Time Impact** card
3. Should show statistics for trades near high-impact events

## Troubleshooting

### Error: "FMP_API_KEY not set"

**Solution:** Ensure environment variables are set:

```bash
# Check if set
echo $FMP_API_KEY

# If not set, add to .env.local and restart
FMP_API_KEY=your_key
```

### Error: "Cannot find package '@supabase/supabase-js'"

**Solution:** Install dependencies:

```bash
pnpm install
```

### Error: "Supabase credentials not set"

**Solution:** Add both environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Error: "FMP API returned 403"

**Solution:** 
- Check FMP API key is valid
- Verify key has access to economic-calendar endpoint
- Check FMP account is not rate-limited

### Database Error: "Unique constraint violation"

**Solution:** This happens if the same event is inserted twice. The script uses `onConflict` to update existing records, so re-running is safe.

### Missing Data After Running Script

**Solution:**
1. Check script output for errors
2. Verify `source = 'fmp'` in database
3. Check if events are in the future (30-day window from today)
4. Verify FMP API returned data (not empty response)

## Scheduling Automatic Syncs

The system automatically syncs every day at 02:00 UTC via `vercel.json` cron configuration:

```json
{
  "crons": [{
    "path": "/api/economic-calendar/sync",
    "schedule": "0 2 * * *"
  }]
}
```

**This means you don't need to manually run the script regularly** - it's automatic!

The manual script is useful for:
- Initial data load
- Force refresh
- Filling in historical gaps
- Testing

## Integration with Trading Sessions

Once economic events are saved, the system automatically:

1. **Detects trading sessions** when you create trades (using UTC offset + entry time)
2. **Correlates trades** with economic events (within 30-minute window)
3. **Shows analysis** in News Time Impact card

Example in trade creation:

```typescript
await createTrade({
  symbol: 'EURUSD',
  direction: 'long',
  entry_price: 1.0950,
  exit_price: 1.0970,
  entry_time: '2024-06-15T12:15:00Z',
  exit_time: '2024-06-15T13:45:00Z',
  pnl: 200,
  pnl_percent: 1.83,
  user_utc_offset: 3,  // UTC+3
  // ... other fields
})
```

The system will:
1. Calculate session: "New York" (using UTC offset)
2. Check for nearby high-impact events (within 30 mins)
3. Tag the trade: "is_near_high_impact: true"
4. Show comparison in statistics

## API Endpoint Reference

### GET `/api/economic-calendar/sync`

Manually trigger economic data sync.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "fetched": 500,
  "upserted": 187,
  "errors": [],
  "from": "2024-06-09",
  "to": "2024-07-09",
  "source": "fmp"
}
```

### GET `/api/economic-calendar/update-actuals`

Update actual values for released events (runs every 15 mins).

### GET `/api/economic-calendar/events`

Frontend endpoint to read events (used by News Time Impact card).

## Next Steps

1. **Set environment variables** (see Setup Steps above)
2. **Run the fetch script** to load data
3. **Verify in dashboard** that News Time Impact card shows data
4. **Create trades** - session detection happens automatically
5. **View analytics** to see session and news impact correlations

---

**Questions?** Check the ECONOMIC_CALENDAR_README.md for complete system documentation.
