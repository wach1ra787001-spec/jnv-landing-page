# FMP Economic Data - Fetch & Sync Summary

## What Was Implemented

You now have **3 ways** to fetch and save FMP economic calendar data (CPI, NFP, ISM, etc.) to your database:

### 1. **Automatic Daily Sync** ✓ Already Running
- **When:** Every day at 02:00 UTC
- **How:** Vercel Cron job
- **Setup:** Already configured in `vercel.json`
- **Action:** Deploy to Vercel and cron activates automatically

### 2. **Manual Node.js Script** (Local Development)
- **When:** On-demand, anytime
- **How:** Run `node scripts/fetch-fmp-economic-data.mjs` locally
- **Setup:** Requires environment variables in `.env.local`
- **Files:** `/scripts/fetch-fmp-economic-data.mjs`

### 3. **Manual API Endpoint** (Production/Dashboard)
- **When:** On-demand via HTTP request
- **How:** `POST /api/manual-sync` (authenticated)
- **Setup:** Already implemented, no setup needed
- **Files:** `/app/api/manual-sync/route.ts`

## Data Being Fetched

### High-Impact Economic Indicators
- **CPI (Consumer Price Index)** - Inflation measure for major economies
- **NFP (Non-Farm Payroll)** - Monthly US employment report
- **ISM Manufacturing PMI** - Manufacturing sector activity
- **ISM Services PMI** - Services sector activity
- **ADP Employment Report** - Private sector job creation
- **Initial Jobless Claims** - Weekly unemployment filings
- **Retail Sales** - Consumer spending patterns
- **Housing Starts** - New residential construction
- **Building Permits** - Future construction pipeline
- **Factory Orders** - Manufacturing demand
- **Consumer Confidence** - Economic sentiment index

### Major Currency Pairs Covered
- USD (United States)
- EUR (Eurozone)
- GBP (United Kingdom)
- JPY (Japan)
- CAD (Canada)
- AUD (Australia)
- CHF (Switzerland)
- SEK (Sweden)
- CNY (China)
- MXN (Mexico)
- NZD (New Zealand)

### Data Fields Stored
Each event includes:
- **event_name**: CPI m/m, NFP, ISM Manufacturing, etc.
- **currency**: USD, EUR, etc.
- **impact**: high, medium, low
- **event_time_utc**: Exact UTC timestamp
- **forecast**: Expected value before event
- **actual**: Released value (filled in after event)
- **previous**: Prior period value
- **revised**: Updated historical value (if revised)
- **surprise_pct**: Actual vs forecast percentage
- **country**: USA, UK, EUR, etc.
- **is_released**: true/false flag
- **is_revised**: true/false flag

## Quick Start - 3 Steps

### Step 1: Deploy to Vercel
Push your code to GitHub. Vercel automatically:
- ✓ Deploys code
- ✓ Activates cron jobs
- ✓ First sync runs at 02:00 UTC

### Step 2: Trigger Manual Sync (Optional - For Immediate Data)

**Option A: Via Browser (Easiest)**
1. Log into your JNV Pro dashboard
2. Go to **Dashboard → Advanced Stats → Time Analysis**
3. Click **"Sync Economic Data"** button (manual sync button in UI)
4. Wait 30 seconds for data to populate

**Option B: Via API (Programmatic)**
```bash
curl -X POST https://your-domain.vercel.app/api/manual-sync \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Option C: Via Local Script (Development)**
```bash
# Set environment variables
export FMP_API_KEY="your_fmp_key"
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_key"

# Run script
node scripts/fetch-fmp-economic-data.mjs
```

### Step 3: Verify Data

**Check in Dashboard:**
1. Go to **Dashboard → Advanced Stats → Time Analysis**
2. Scroll to **"News Time Impact"** card
3. Should show statistics like:
   - "Trading Near News: 45 trades, 42% win rate"
   - "Normal Trading: 180 trades, 54% win rate"

**Check via Database:**
```sql
SELECT COUNT(*) FROM economic_events WHERE source = 'fmp';
-- Should return > 100
```

## File Reference

| File | Purpose | Type |
|------|---------|------|
| `/scripts/fetch-fmp-economic-data.mjs` | Manual fetch script | Standalone script |
| `/app/api/manual-sync/route.ts` | Dashboard sync endpoint | HTTP API |
| `/app/api/economic-calendar/sync/route.ts` | Cron sync job | Cron job |
| `/app/api/economic-calendar/update-actuals/route.ts` | Updates actuals | Cron job (15-min) |
| `/lib/session-detection-engine.ts` | Session detection | Utility library |
| `/lib/services/trade-service.ts` | Trade creation with session detection | Service layer |
| `vercel.json` | Cron schedules | Configuration |
| `MANUAL_FMP_SYNC_GUIDE.md` | Detailed sync guide | Documentation |

## Environment Variables Required

For manual script or API endpoint to work:

```
FMP_API_KEY=your_fmp_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Get them from:**
- FMP Key: https://site.financialmodelingprep.com/developer/docs/
- Supabase: Dashboard → Settings → API

## Integration with Advanced Statistics

Once economic data is fetched, the system **automatically**:

1. **Detects Trade Sessions**
   - When you create a trade with UTC offset
   - System calculates: Asian, London, New York, or Off-hours
   - Stores session name in database

2. **Correlates Trades with News**
   - Checks if trade entry time is within 30 mins of high-impact event
   - Tags trades as "near_news" or "normal"
   - Calculates separate statistics for each

3. **Shows in Dashboard**
   - News Time Impact card displays comparison
   - Shows win rate and P&L difference
   - Helps identify if news timing affects trading results

### Example Flow

```
User creates trade:
  → Entry time: 2024-06-15 12:15 UTC
  → User UTC offset: +3 (UTC+3)
  → Session calculated: "New York" (13:00-21:00 UTC)
  → Check for news: NFP at 12:30 UTC (within 30 min window)
  → Tag: is_near_high_impact = true
  
Advanced Stats shows:
  → "Trading Near News: 42% win rate"
  → "Normal Trading: 54% win rate"
  → Insight: Your win rate is 12% lower during news
```

## Sync Schedule

| Task | Schedule | Purpose |
|------|----------|---------|
| Economic Calendar Sync | Daily 02:00 UTC | Fetch next 30 days of events |
| Update Actuals | Every 15 minutes | Fill in released values |
| Manual Sync | On-demand | Immediate refresh |

## Data Retention

- **Events kept for:** Next 30 days + historical (never deleted)
- **Forecast updates:** Continuous as events approach
- **Actual values:** Updated within 1-2 hours of release
- **Revised values:** Updated when released (usually 30 days later)

## Troubleshooting

### No data appearing in dashboard?

1. **Verify cron is running:**
   - Vercel Dashboard → Deployments → check for "cron" in logs

2. **Check database:**
   ```sql
   SELECT COUNT(*) FROM economic_events WHERE source = 'fmp';
   ```

3. **Manual sync:**
   - Click "Sync Economic Data" button or run manual script

### News Time Impact card shows 0 trades?

1. **Need closed trades first** - Create at least 1 closed trade
2. **Check trade times** - Are they within 30 mins of any event?
3. **Check UTC offset** - Is user's UTC offset saved in profile?

### FMP API errors?

1. Check API key is valid at https://site.financialmodelingprep.com/dashboard
2. Verify key has access to /economic-calendar endpoint
3. Check account isn't rate-limited

## Next Steps

1. **Deploy code to Vercel** → Cron jobs activate automatically
2. **First data load** → Happens at 02:00 UTC tomorrow (or manual trigger)
3. **View in dashboard** → News Time Impact card populates with real data
4. **Create trades** → Session detection + news correlation happen automatically

---

**All ready!** Your JNV Pro app now has a complete economic calendar system integrated with your trading analysis. 🚀

For detailed implementation guide, see: **MANUAL_FMP_SYNC_GUIDE.md**
