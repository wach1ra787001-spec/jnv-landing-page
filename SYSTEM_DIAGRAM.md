# Economic Calendar - System Diagram

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  TradingEconomics API                ForexFactory RSS            │
│  https://api.tradingeconomics.com/   (Fallback)                 │
│  - High/Medium/Low impact            - Free, weekly             │
│  - 30-day forecast                   - Auto-fallback            │
│  - Needs API key (free tier)                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CRON JOB 1: SYNC                              │
├─────────────────────────────────────────────────────────────────┤
│  /api/economic-calendar/sync                                     │
│  ├─ Schedule: 0 2 * * * (Daily at 02:00 UTC)                   │
│  ├─ Auth: CRON_SECRET header                                    │
│  └─ Action: Fetch next 30 days + upsert to DB                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRES DB                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Table: economic_events                                          │
│  ├─ ~150 events stored (per month)                              │
│  ├─ 4 indexes for fast queries                                  │
│  ├─ RLS: Authenticated users can read                           │
│  ├─ Dedup: source, source_id, event_time_utc                   │
│  └─ Fields: name, currency, impact, forecast, actual...        │
│                                                                   │
│  Example Record:                                                 │
│  {                                                               │
│    event_name: "Non-Farm Payroll",                              │
│    currency: "USD",                                              │
│    impact: "high",                                               │
│    event_time_utc: "2026-06-09T12:30:00Z",                     │
│    forecast: "180K",                                             │
│    actual: null,                                                 │
│    is_released: false                                            │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
        │                              │
        │                              │
        ▼                              ▼
┌──────────────────┐     ┌─────────────────────────────────────┐
│  CRON JOB 2:     │     │  APP QUERIES (Any Time)             │
│  UPDATE ACTUALS  │     │  /api/economic-calendar/events      │
│                  │     │  - Frontend read endpoint           │
│  Schedule: */15  │     │  - Filters: impact, currency, date  │
│  * * * * (Every  │     │  - Auth: Authenticated users only   │
│  15 mins)        │     └─────────────────────────────────────┘
│                  │
│  Action: Update  │
│  actual values & │
│  calculate       │
│  surprise_pct    │
└──────────────────┘

                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVER-SIDE UTILITIES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  lib/economicCalendar.ts ('use server')                         │
│                                                                   │
│  ├─ analyzeNewsImpact(trades, window)                           │
│  │  └─ Splits trades into:                                      │
│  │     ├─ Near News (within window of high-impact)              │
│  │     └─ Normal Time (all others)                              │
│  │                                                               │
│  ├─ tagTradesWithNews(trades, window)                           │
│  │  └─ Marks each trade with nearest event                      │
│  │                                                               │
│  ├─ getHighImpactEvents(from, to, currencies)                   │
│  │  └─ Query high-impact events by date/currency               │
│  │                                                               │
│  ├─ getEventsNearTrade(tradeTime, window)                       │
│  │  └─ Find events within time window of trade                 │
│  │                                                               │
│  └─ getEventsByCurrency(currency, from, to)                     │
│     └─ Query events by specific currency                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           TIME ANALYSIS PAGE (Server Component)                  │
├─────────────────────────────────────────────────────────────────┤
│  /app/dashboard/advanced-stats/time/page.tsx                    │
│                                                                   │
│  1. Fetch all closed trades for user                            │
│  2. Call analyzeNewsImpact() with 30-min window                │
│  3. Pass results to TimeAnalysisClient                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│        TIME ANALYSIS CLIENT (Client Component)                   │
├─────────────────────────────────────────────────────────────────┤
│  components/advanced-stats/TimeAnalysisClient.tsx               │
│                                                                   │
│  Receives Props:                                                 │
│  ├─ trades: Trade[]                                             │
│  └─ newsImpactData: {                                           │
│       nearNews: { trades, wins, losses, winRate, pnl }         │
│       normalTime: { trades, wins, losses, winRate, pnl }       │
│     }                                                            │
│                                                                   │
│  Renders 4 Cards:                                               │
│  ├─ SessionAnalysisCard (Asia, London, NY)                      │
│  ├─ HoldingTimeVsPnLCard (Duration analysis)                   │
│  ├─ NewsTimeImpactCard ← NEWS DATA                             │
│  └─ MonthOverMonthCard (Monthly P&L)                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            NEWS TIME IMPACT CARD (UI Display)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          News Time Impact Analysis                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌──────────────────────┬──────────────────────┐        │  │
│  │  │  Trading Near News   │  Normal Trading      │        │  │
│  │  ├──────────────────────┼──────────────────────┤        │  │
│  │  │  Total: 45 trades    │  Total: 180 trades   │        │  │
│  │  │  Win Rate: 42.1%     │  Win Rate: 54.3%     │        │  │
│  │  │  Wins: 19            │  Wins: 98            │        │  │
│  │  │  Losses: 26          │  Losses: 82          │        │  │
│  │  │  P&L: +$1,250        │  P&L: +$3,890        │        │  │
│  │  └──────────────────────┴──────────────────────┘        │  │
│  │                                                            │  │
│  │  Key Insight:                                             │  │
│  │  Your win rate is 12.2% lower during news times.         │  │
│  │  Consider avoiding trades near major economic events.    │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Query Example - How News Impact is Calculated

```
Trade Entry: 2026-06-09 12:25 UTC
Event Time:  2026-06-09 12:30 UTC (High-impact)
Window:      30 minutes

Time Diff: 5 minutes
Status: ✅ NEAR NEWS EVENT (within 30 min window)

Results for all trades:
├─ 45 trades within 30 mins of high-impact events
│  └─ Win Rate: 42.1%
│
└─ 180 trades NOT within 30 mins of any high-impact events
   └─ Win Rate: 54.3%

Conclusion: News times underperform by 12.2%
```

## File Organization

```
/vercel/share/v0-project/
├── types/
│   └── economic.ts                    ← TypeScript types
├── lib/
│   ├── economicCalendar.ts           ← Server utilities ('use server')
│   ├── forexFactoryFallback.ts       ← RSS parser
│   └── time-analysis-utils.ts        ← Analysis helpers (modified)
├── app/api/economic-calendar/
│   ├── sync/route.ts                 ← Fetch & store (daily)
│   ├── update-actuals/route.ts       ← Update releases (15-min)
│   └── events/route.ts               ← Frontend read
├── app/dashboard/advanced-stats/
│   └── time/
│       └── page.tsx                  ← Time Analysis page (modified)
├── components/advanced-stats/
│   └── TimeAnalysisClient.tsx         ← Client component (modified)
├── vercel.json                        ← Cron schedule
├── ECONOMIC_CALENDAR_README.md        ← Full documentation
├── SETUP_ECONOMIC_CALENDAR.md         ← Quick setup
└── IMPLEMENTATION_SUMMARY.md          ← This summary
```

## Data Transformation Pipeline

```
TradingEconomics Raw
│
├─ Category → event_name
├─ Currency → currency (uppercase)
├─ Importance (1,2,3) → impact (high, medium, low)
├─ Date → event_time_utc (ISO string)
├─ Forecast → forecast (string)
├─ Actual → actual (string)
├─ Previous → previous (string)
├─ Revised → revised (string)
├─ CalendarId → source_id
└─ 'trading_economics' → source

       ▼

Upsert to economic_events
(Dedup: source + source_id + event_time_utc)

       ▼

When actual released:
- Set is_released = true
- Calculate surprise_pct = (actual - forecast) / |forecast| * 100
- Update updated_at timestamp

       ▼

Available for queries via:
- analyzeNewsImpact()
- getHighImpactEvents()
- getEventsNearTrade()
- etc.
```

## Environment Variables Flow

```
Vercel Project Settings (Env Vars)
├─ CRON_SECRET
│  └─ Used in Authorization header for cron jobs
│
└─ TRADING_ECONOMICS_API_KEY
   └─ Used in API URL query parameters for data fetch

         ▼

API Routes
├─ /api/economic-calendar/sync
│  └─ Receives CRON_SECRET in header
│  └─ Uses TRADING_ECONOMICS_API_KEY for fetch
│
└─ /api/economic-calendar/update-actuals
   └─ Receives CRON_SECRET in header
   └─ Uses TRADING_ECONOMICS_API_KEY (if needed)

         ▼

Server Functions
└─ lib/economicCalendar.ts
   └─ Uses Supabase from environment (auto-injected)
```

---

**Generated:** 2026-06-09  
**System Status:** ✅ Production Ready
