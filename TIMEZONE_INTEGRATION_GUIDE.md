# Timezone Infrastructure - Integration Checklist

## For Developers: How to Use TimeService in Your Components

### Step 1: Import the Hook
```typescript
import { useTimeService } from '@/lib/context/timezone-context'
```

### Step 2: Get the Service
```typescript
const timeService = useTimeService()
```

### Step 3: Use Common Operations

#### Display Trade Time
```typescript
const displayTime = timeService.format(trade.entryTime, 'MMM dd, HH:mm')
// Output: "Jan 15, 14:30" (in user's timezone)
```

#### Detect Session
```typescript
const session = timeService.getSessionFromUTC(trade.entryTime)
// Output: 'london' | 'newyork' | 'asia' | 'overlap' | 'closed'

const sessionInfo = timeService.getSessionInfo(session)
// Output: { name: 'London', utcStart: 7, utcEnd: 15 }
```

#### Calculate Duration
```typescript
const minutes = timeService.getHoldingTimeMinutes(entry, exit)
const bucket = timeService.getHoldingTimeBucket(minutes)
// Output: 'short' | 'medium' | 'long' etc.
```

#### Check News Impact
```typescript
const nearNews = timeService.isNearNewsTime(trade.entryTime, 30)
// Output: true/false (within 30 min of major news)
```

---

## For Backend: API Routes with Timezone

### Fetch Trades with Timezone Enrichment
```typescript
import { TimeService } from '@/lib/services/time-service'

const timeService = new TimeService(userTimezone)

const trades = await supabase
  .from('trades')
  .select('*')
  .eq('user_id', userId)

const enriched = trades.map(t => ({
  ...t,
  session: timeService.getSessionFromUTC(t.entry_time),
  entryDisplay: timeService.format(t.entry_time, 'HH:mm'),
  holdingMins: timeService.getHoldingTimeMinutes(t.entry_time, t.exit_time),
}))
```

### Query Specific Date in User's Timezone
```typescript
// User wants trades from "Jan 15" in their timezone
const userDate = new Date(2024, 0, 15) // Jan 15
const { start, end } = timeService.getDayBoundariesInUTC(userDate)

const trades = await supabase
  .from('trades')
  .select('*')
  .gte('entry_time', start)
  .lt('entry_time', end)
```

---

## Common Patterns

### Pattern 1: Trade List with Session Badges
```typescript
export function TradeList({ trades }) {
  const timeService = useTimeService()
  
  return (
    <div>
      {trades.map(trade => (
        <div key={trade.id}>
          <span>{timeService.format(trade.entryTime, 'HH:mm')}</span>
          <Badge>{timeService.getSessionFromUTC(trade.entryTime)}</Badge>
          <span>{trade.pnl}</span>
        </div>
      ))}
    </div>
  )
}
```

### Pattern 2: Session Performance Breakdown
```typescript
export function SessionStats({ trades }) {
  const timeService = useTimeService()
  
  const bySession = trades.reduce((acc, trade) => {
    const session = timeService.getSessionFromUTC(trade.entryTime)
    if (!acc[session]) acc[session] = []
    acc[session].push(trade)
    return acc
  }, {})
  
  return Object.entries(bySession).map(([session, trades]) => (
    <Card key={session}>
      <h3>{timeService.getSessionInfo(session)?.name}</h3>
      <p>Trades: {trades.length}</p>
      <p>Win Rate: {(trades.filter(t => t.pnl > 0).length / trades.length * 100).toFixed(1)}%</p>
    </Card>
  ))
}
```

### Pattern 3: Holding Time Impact Analysis
```typescript
export function HoldingTimeAnalysis({ trades }) {
  const timeService = useTimeService()
  
  const byDuration = trades.reduce((acc, trade) => {
    const mins = timeService.getHoldingTimeMinutes(trade.entryTime, trade.exitTime)
    const bucket = timeService.getHoldingTimeBucket(mins)
    if (!acc[bucket]) acc[bucket] = []
    acc[bucket].push(trade)
    return acc
  }, {})
  
  return Object.entries(byDuration).map(([bucket, trades]) => (
    <div key={bucket}>
      <h4>{bucket}</h4>
      <p>Avg P&L: {(trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length).toFixed(2)}</p>
    </div>
  ))
}
```

### Pattern 4: News Impact Comparison
```typescript
export function NewsImpactCard({ trades }) {
  const timeService = useTimeService()
  
  const nearNews = trades.filter(t => timeService.isNearNewsTime(t.entryTime, 30))
  const normal = trades.filter(t => !timeService.isNearNewsTime(t.entryTime, 30))
  
  const getStats = (tradeList) => ({
    count: tradeList.length,
    winRate: (tradeList.filter(t => t.pnl > 0).length / tradeList.length * 100).toFixed(1),
    avgPnL: (tradeList.reduce((s, t) => s + t.pnl, 0) / tradeList.length).toFixed(2),
  })
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4>During News</h4>
        <Stats {...getStats(nearNews)} />
      </div>
      <div>
        <h4>Normal Time</h4>
        <Stats {...getStats(normal)} />
      </div>
    </div>
  )
}
```

---

## Timezone Configuration for Features

### For News Impact Statistics
```typescript
// Initialize TimeService
const timeService = new TimeService(user.timezone)

// All news times are in UTC
const newsTimesUTC = {
  london: 3,    // 03:00 UTC
  newyork: 8.5, // 08:30 UTC
}

// Check if trade was near news
const nearNews = timeService.isNearNewsTime(trade.entryTime, 30)

// Get session to correlate with news
const session = timeService.getSessionFromUTC(trade.entryTime)
```

### For Session-Based Analysis
```typescript
const sessions = ['asia', 'london', 'newyork']

sessions.forEach(session => {
  const sessionTrades = trades.filter(t => 
    timeService.getSessionFromUTC(t.entryTime) === session
  )
  
  const stats = calculateStats(sessionTrades)
  console.log(`${session}: ${stats.winRate}% win rate`)
})
```

### For Month-over-Month Comparison
```typescript
// Group trades by month (using UTC dates)
const byMonth = trades.reduce((acc, trade) => {
  const date = timeService.toUserTime(trade.entryTime)
  const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
  if (!acc[monthKey]) acc[monthKey] = []
  acc[monthKey].push(trade)
  return acc
}, {})

// Display 12 months
Object.entries(byMonth).forEach(([month, monthTrades]) => {
  console.log(`${month}: ${monthTrades.length} trades`)
})
```

---

## Debugging Timezone Issues

### Check User's Timezone
```typescript
const { userTimezone } = useTimezone()
console.log('User timezone:', userTimezone)
```

### Verify Session Detection
```typescript
const timeService = useTimeService()
const utcDate = new Date('2024-01-15T14:30:00Z')
const session = timeService.getSessionFromUTC(utcDate)
console.log('Session:', session) // Should be 'london'
```

### Check Timezone Offset
```typescript
const offset = timeService.getTimezoneOffset()
console.log('Current offset:', offset) // e.g., "UTC-5"
```

### Verify UTC Boundaries
```typescript
const { start, end } = timeService.getDayBoundariesInUTC(new Date())
console.log('UTC start:', start.toISOString())
console.log('UTC end:', end.toISOString())
```

---

## Important Reminders

- TimeService is always the single source of truth
- All database queries use UTC timestamps
- User timezone is converted at display time only
- No independent timezone calculations
- Test across multiple timezones using browser dev tools
- News Impact Statistics depends on accurate session detection

---

## Next: Building News Impact Statistics

With this timezone infrastructure, the News Impact Statistics feature can now:
1. Accurately match trades to news times by session
2. Determine if trade was during/near news
3. Compare performance during news vs. normal trading
4. Provide session-based breakdowns
5. Support month-over-month analysis with proper timezone handling
