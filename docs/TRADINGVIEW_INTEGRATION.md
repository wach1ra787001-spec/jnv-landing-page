# TradingView Charting Library Integration Guide

## Overview

This document covers the complete integration of the licensed **TradingView Charting Library** into the JNV Trading Journal application. The library has been configured for production deployment on Vercel with support for live market data, trade overlays, and dark/light themes.

## Architecture

```
┌─────────────────────────────────────────────┐
│        React Component Layer                 │
│  (TradingViewChart.tsx - Client-side only)  │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│    TradingView Library (charting_library)   │
│           (Licensed Version)                 │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│   Datafeed Implementation (UDF Protocol)    │
│    (Currently: Demo | Production: Your API) │
└─────────────────────────────────────────────┘
```

## File Structure

### Core Integration Files

```
/lib/tradingview/
├── datafeed.ts          # UDF datafeed implementation
└── utils.ts             # Symbol parsing, interval conversion

/components/
└── tradingview-chart.tsx  # Main reusable React component

/public/
└── charting_library/    # TradingView library files
    ├── charting_library.min.js
    └── charting_library.css

/app/dashboard/
└── tradingview-chart/
    └── page.tsx         # Standalone chart page
```

### Pages Using TradingView

- `/dashboard/tradingview-chart` - Standalone advanced chart viewer
- `/dashboard/trade-detail/[id]` - Trade detail page (ready for overlay integration)
- `/dashboard/trade-history` - Trade history with chart integration

## Getting Started

### 1. Setup TradingView Library Files

The TradingView Charting Library must be placed in the public directory for Vercel to serve it correctly:

```bash
# Copy the licensed charting_library files to:
/public/charting_library/
├── charting_library.min.js
├── charting_library.css
└── datafeeds/
    └── udf/
        └── dist/
            └── bundle.js
```

**Important:** These files are provided by TradingView when you receive the licensed version. Verify they're served correctly by checking:
```
https://yourdomain.com/charting_library/charting_library.min.js
```

### 2. Environment Configuration

Add to your `.env.local` or deployment environment variables:

```env
# TradingView Datafeed URL (demo for now)
NEXT_PUBLIC_TRADINGVIEW_DATAFEED=https://demo_feed.tradingview.com
```

### 3. Verify Library Loading

Check the browser console:
- ✅ No 404 errors for `/charting_library/charting_library.min.js`
- ✅ TradingView object available in window
- ✅ Chart renders with sample data

## Component Usage

### Basic Usage

```tsx
import { TradingViewChart } from '@/components/tradingview-chart'

export default function MyChart() {
  return (
    <TradingViewChart
      symbol="EURUSD"
      interval="60"
      height={600}
      theme="auto"
    />
  )
}
```

### With Trade Overlays

```tsx
<TradingViewChart
  symbol="EURUSD"
  interval="60"
  showTradeOverlays={true}
  tradeEntry={{ price: 1.0950, time: Date.now() }}
  tradeExit={{ price: 1.0980, time: Date.now() + 3600000 }}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `symbol` | string | 'EURUSD' | Trading symbol (e.g., 'EURUSD', 'AAPL') |
| `interval` | string | '60' | Chart timeframe ('1', '5', '15', '30', '60', '1D', '1W', '1M') |
| `theme` | 'light' \| 'dark' \| 'auto' | 'auto' | Chart theme |
| `height` | number \| string | 500 | Chart container height |
| `containerId` | string | 'tradingview-chart' | HTML element ID for chart |
| `showTradeOverlays` | boolean | false | Show entry/exit markers |
| `tradeEntry` | object | undefined | Entry point { price, time } |
| `tradeExit` | object | undefined | Exit point { price, time } |

## Datafeed Integration

### Current State: Demo Datafeed

Currently, the integration uses TradingView's demo datafeed for development and testing. The datafeed configuration is in `/lib/tradingview/datafeed.ts`.

### Production Datafeed Setup

To connect live market data, follow these steps:

#### Step 1: Choose Your Data Provider

Options:
- **IQFeed** - For US equities and futures
- **Polygon.io** - For stocks, options, crypto
- **Finnhub** - For stocks and crypto
- **Alpaca** - For equities with paper trading
- **TradingView UDF Protocol** - Custom implementation for your broker

#### Step 2: Implement UDF Interface

Update `/lib/tradingview/datafeed.ts` - implement these functions:

```typescript
{
  onReady(callback) // Called when chart initializes
  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback)
  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback)
  getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback)
  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriptionUID, onResetCacheCallback)
  unsubscribeBars(subscriptionUID)
}
```

#### Step 3: Update Backend API

Create API routes for market data:

```
/app/api/tradingview/
├── symbols/route.ts       # Symbol search and resolution
├── bars/route.ts          # OHLC data endpoint
├── subscribe/route.ts     # Real-time subscription
└── unsubscribe/route.ts   # Cleanup subscription
```

#### Step 4: Configure Environment Variables

```env
TRADINGVIEW_DATA_PROVIDER=polygon
POLYGON_API_KEY=your_key_here
TRADINGVIEW_DATAFEED=https://yourdomain.com/api/tradingview
```

#### Step 5: Test Connection

```tsx
// Test in browser console
const feed = createDatafeed()
feed.onReady((config) => console.log('Datafeed ready:', config))
```

## Integration with Trade Journal

### Trade Detail Page - Add Chart

Update `/app/dashboard/trade-detail/[id]/page.tsx`:

```tsx
import { TradingViewChart } from '@/components/tradingview-chart'

export default function TradeDetailPage() {
  return (
    <div className="space-y-6">
      {/* Existing trade details */}
      
      {/* Add chart with trade overlays */}
      {trade && (
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
      )}
    </div>
  )
}
```

### Trade History Page - Chart Integration

Add chart filtering by trade symbol and timeframe selection.

## Known Limitations & Future Enhancements

### Current Limitations

1. ✋ **Demo Datafeed Only** - Uses TradingView demo data
2. 📊 **No Trade Overlays** - Entry/exit marks not yet implemented (TODO in code)
3. 🔐 **No Layout Saving** - Chart layouts reset on page reload
4. 📱 **Mobile** - Chart is responsive but optimized for desktop

### Planned Enhancements

- [ ] Connect live datafeed from your broker
- [ ] Draw entry/exit lines and labels on chart
- [ ] Save and restore chart layouts per user
- [ ] Add chart annotations and drawings
- [ ] Export chart images
- [ ] Add multiple timeframe analysis
- [ ] Integrate with trade journal entries

## Troubleshooting

### Chart Not Appearing

**Symptom:** Gray box or "Initializing chart..." message persists

**Check:**
1. Is `/charting_library/charting_library.min.js` accessible?
   ```bash
   curl https://yourdomain.com/charting_library/charting_library.min.js
   ```

2. Browser console errors? Check DevTools → Console tab
3. Is component mounted on client? (should be, using 'use client')

### Symbol Not Resolving

**Symptom:** "Invalid symbol" error or chart won't load symbol

**Fix:** Implement symbol resolution in datafeed:
```typescript
resolveSymbol: (symbolName, onSymbolResolvedCallback) => {
  // Add your symbol validation
  // Return symbol metadata
}
```

### Theme Not Changing

**Symptom:** Chart stays dark even in light mode

**Fix:** Ensure `next-themes` is configured and TradingView theme is set to `'auto'`:
```tsx
<TradingViewChart theme="auto" />
```

### Hydration Errors

**Symptom:** "Text content did not match" errors during build

**Fix:** Component is 'use client' with mounted check - verify:
1. `setMounted(true)` in useEffect
2. Conditional render based on `mounted`
3. No server-side rendering of TradingView code

## Performance Optimization

### Load TradingView Library Only When Needed

```tsx
// Use dynamic import for chart page
import dynamic from 'next/dynamic'

const TradingViewChart = dynamic(
  () => import('@/components/tradingview-chart'),
  { ssr: false }
)
```

### Cache Chart Data

```tsx
const { data: chartData } = useSWR(
  [`/api/tradingview/bars/${symbol}/${interval}`, symbol, interval],
  fetcher,
  { revalidateOnFocus: false }
)
```

## Testing

### Manual Testing Checklist

- [ ] Chart loads on `/dashboard/tradingview-chart`
- [ ] Symbol change updates chart
- [ ] Interval change updates timeframe
- [ ] Theme toggle works (if using 'auto')
- [ ] Chart resizes responsively
- [ ] No console errors
- [ ] Component unmounts cleanly (no memory leaks)

### Development Testing

```bash
npm run dev
# Navigate to http://localhost:3000/dashboard/tradingview-chart
```

## Production Deployment

### Before Deploying to Vercel

1. ✅ Verify library files are in `/public/charting_library/`
2. ✅ Set `NEXT_PUBLIC_TRADINGVIEW_DATAFEED` in Vercel environment
3. ✅ Test chart loads at production URL
4. ✅ Verify no 404 errors for library files

### Vercel Deployment Commands

```bash
# Ensure library files are included
git add public/charting_library/
git commit -m "Add TradingView library files"
git push

# Vercel deploys automatically
```

## Support & Resources

- **TradingView Docs:** https://www.tradingview.com/charting-library/
- **UDF Protocol:** https://www.tradingview.com/charting-library/udf/
- **Market Data APIs:**
  - Polygon.io: https://polygon.io/
  - Finnhub: https://finnhub.io/
  - IQFeed: https://www.iqfeed.net/

## Next Steps

1. Place TradingView library files in `/public/charting_library/`
2. Verify chart loads at `/dashboard/tradingview-chart`
3. Set up production datafeed connection
4. Add trade overlays to trade detail page
5. Deploy to Vercel

---

**Last Updated:** 2026-07-16
**Integration Status:** ✅ Ready for Production (Demo Datafeed)
