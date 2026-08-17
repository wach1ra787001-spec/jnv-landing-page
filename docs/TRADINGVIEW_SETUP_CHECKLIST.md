# TradingView Integration Setup Checklist

## Pre-Integration ✓

- [x] Licensed TradingView Charting Library obtained from official GitHub invite
- [x] React component created (`components/tradingview-chart.tsx`)
- [x] Datafeed configuration ready (`lib/tradingview/datafeed.ts`)
- [x] Utility functions implemented (`lib/tradingview/utils.ts`)
- [x] Chart page created (`app/dashboard/tradingview-chart/page.tsx`)
- [x] Documentation written

## Installation Steps

### Step 1: Add Library Files to Public Folder

```bash
# Copy the TradingView library files to your project:
# Source: Your licensed TradingView files
# Destination: /public/charting_library/

# File structure should look like:
/public/charting_library/
├── charting_library.min.js        (Main library)
├── charting_library.css            (Styles)
├── charting_library.standalone.js  (Standalone version - optional)
└── datafeeds/                      (If using UDF)
    └── udf/
        └── dist/
            └── bundle.js
```

**How to add files:**
```bash
# Option 1: Using command line
cp -r /path/to/charting_library/* public/charting_library/

# Option 2: Manual
# 1. Create folder: public/charting_library/
# 2. Copy files there
# 3. Git add and commit
```

### Step 2: Verify Library Loads

Run development server:
```bash
npm run dev
```

Visit: `http://localhost:3000/dashboard/tradingview-chart`

Check browser console:
```
✅ No 404 errors for /charting_library/charting_library.min.js
✅ Chart renders with demo data
✅ Symbol and interval controls work
```

### Step 3: Configure Environment (Optional)

For production datafeed, add to `.env.local` or Vercel dashboard:

```env
# Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_TRADINGVIEW_DATAFEED=https://demo_feed.tradingview.com
```

### Step 4: Test Chart Display

**Test Cases:**

| Test | Expected Result | Status |
|------|-----------------|--------|
| Load chart page | Chart renders | ⏳ |
| Change symbol | Chart updates to new symbol | ⏳ |
| Change interval | Chart updates timeframe | ⏳ |
| Toggle dark/light | Chart theme changes | ⏳ |
| Resize window | Chart resizes with container | ⏳ |
| Console has no errors | 0 errors in DevTools | ⏳ |

## Production Integration Steps

### Step 1: Deploy Library Files to Vercel

```bash
# Ensure files are committed to git
git add public/charting_library/
git commit -m "Add TradingView Charting Library"
git push origin main
```

Vercel automatically deploys everything in `/public`.

**Verify in production:**
```bash
https://your-domain.com/charting_library/charting_library.min.js
# Should return 200 OK with library content
```

### Step 2: Add to Trade Pages

#### Trade Detail Page

Add chart to `/app/dashboard/trade-detail/[id]/page.tsx`:

```tsx
import { TradingViewChart } from '@/components/tradingview-chart'
import { getRecommendedInterval } from '@/lib/tradingview/utils'

// In your JSX:
{trade && (
  <div className="mt-6">
    <h2 className="text-2xl font-bold mb-4">Chart</h2>
    <TradingViewChart
      symbol={trade.symbol}
      interval={getRecommendedInterval(
        new Date(trade.entry_time),
        new Date(trade.exit_time)
      )}
      showTradeOverlays={true}
      tradeEntry={{
        price: trade.entry_price,
        time: new Date(trade.entry_time).getTime() / 1000,
      }}
      tradeExit={{
        price: trade.exit_price,
        time: new Date(trade.exit_time).getTime() / 1000,
      }}
      height={500}
    />
  </div>
)}
```

#### Trade History Page

Add chart filtering or embedded chart display.

### Step 3: Connect Live Datafeed (Optional)

When ready to connect live market data:

1. Choose data provider (Polygon, Finnhub, IQFeed, etc.)
2. Update `/lib/tradingview/datafeed.ts` with real API calls
3. Create backend API routes for datafeed endpoints
4. Update `.env` with API keys
5. Test with live symbols

## Troubleshooting During Setup

### Issue: "charting_library.min.js not found" (404)

**Cause:** File not in public folder

**Fix:**
```bash
# Check file exists
ls -la public/charting_library/charting_library.min.js

# If not found, copy it
cp /source/path/charting_library.min.js public/charting_library/
```

### Issue: Chart renders but says "Initializing..." forever

**Cause:** Datafeed not returning symbol data

**Fix:**
1. Open DevTools → Network tab
2. Look for datafeed calls (should see onReady, resolveSymbol)
3. Check if they're returning 200 OK
4. Check /lib/tradingview/datafeed.ts resolveSymbol method

### Issue: "TradingView is not defined"

**Cause:** Library script didn't load

**Fix:**
1. Check Network tab - is `/charting_library/charting_library.min.js` loaded?
2. Verify MIME type is `application/javascript`
3. Try hard refresh (Cmd+Shift+R)
4. Check browser console for parse errors

### Issue: Hydration errors in console

**Cause:** Server-side rendering of TradingView

**Fix:** Already handled - component uses 'use client' and checks `mounted`
- Make sure component is not imported in server-side pages
- Use dynamic import if needed

## Verification Checklist

Before calling integration complete:

- [ ] Chart page loads without errors: `http://localhost:3000/dashboard/tradingview-chart`
- [ ] Symbol change works (try "GBPUSD")
- [ ] Interval change works (try "1D")
- [ ] No console errors
- [ ] Chart renders with data
- [ ] Responsive on mobile
- [ ] Production URL works: `https://your-domain.com/dashboard/tradingview-chart`
- [ ] Library file size reasonable (~1-2MB)
- [ ] No performance warnings in DevTools

## File Checklist

### Created Files

- [x] `/lib/tradingview/datafeed.ts` - Datafeed configuration
- [x] `/lib/tradingview/utils.ts` - Utility functions
- [x] `/components/tradingview-chart.tsx` - Main React component
- [x] `/app/dashboard/tradingview-chart/page.tsx` - Chart page
- [x] `/docs/TRADINGVIEW_INTEGRATION.md` - Full documentation
- [x] `/docs/TRADINGVIEW_SETUP_CHECKLIST.md` - This checklist

### Files to Add Manually

- [ ] `/public/charting_library/charting_library.min.js`
- [ ] `/public/charting_library/charting_library.css`
- [ ] `/public/charting_library/datafeeds/` (if applicable)

## Next: Integration with Trade Journal

Once chart is displaying:

1. **Trade Detail Integration**
   - Add chart to trade detail page
   - Show entry/exit markers
   - Link trade data to chart

2. **Trade History Integration**
   - Add symbol-based filtering
   - Show recent trades with charts

3. **Data Provider Connection**
   - Connect to live market data
   - Set up real-time subscriptions
   - Test with live trades

## Support Resources

- TradingView Charting Library: https://www.tradingview.com/charting-library/
- UDF Protocol: https://www.tradingview.com/charting-library/udf/
- Next.js Public Files: https://nextjs.org/docs/app/building-your-application/optimizing/static-assets
- Vercel Deployment: https://vercel.com/docs/deployments/overview

---

**Status:** 🚀 Ready for Library Installation
**Last Updated:** 2026-07-16
