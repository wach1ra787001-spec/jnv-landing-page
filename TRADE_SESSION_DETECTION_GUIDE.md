# Trade Session Detection Engine - Implementation Guide

## Overview

The Trade Session Detection Engine is a standalone utility that determines the trading session (Asian, London, New York, or Off-Session) for every trade based on:

1. **The documented trade time** - entered by the user
2. **The user's UTC offset** - selected in Settings (e.g., UTC+3, UTC-4)

**Critical Design Principle:** The system never uses device time, browser time, server time, location data, or IP address. The user's selected UTC offset is the single source of truth.

---

## Session Classification

### Master Session Schedule (UTC)

All session calculations use these exact UTC windows:

| Session | UTC Time | Hours |
|---------|----------|-------|
| Asian Session | 23:00 - 06:59 | 7 hours (wraps midnight) |
| London Session | 07:00 - 12:59 | 6 hours |
| New York Session | 13:00 - 20:59 | 8 hours |
| Off Session | 21:00 - 22:59 | 2 hours |

### Conversion Formula

```
UTC Time = Documented Time - User UTC Offset

Examples:
- User UTC+3, trade at 08:00 → UTC = 08:00 - 3 = 05:00 ✓ Asian Session
- User UTC+3, trade at 11:00 → UTC = 11:00 - 3 = 08:00 ✓ London Session
- User UTC+3, trade at 18:00 → UTC = 18:00 - 3 = 15:00 ✓ New York Session
- User UTC-4, trade at 09:00 → UTC = 09:00 - (-4) = 13:00 ✓ New York Session
```

---

## Implementation Files

### 1. `lib/session-detection-engine.ts` (Main Module)

The core session detection logic. Key functions:

#### `detectTradeSession(documentedTimeStr, userUtcOffset): SessionDetectionResult`

Main entry point. Takes trade time and UTC offset, returns session classification.

```typescript
const result = detectTradeSession('2024-01-15T08:30:00', 3); // User UTC+3

result = {
  documented_trade_time: '2024-01-15T08:30:00',
  user_timezone_offset: 3,
  calculated_utc_time: '2024-01-15T05:30:00Z',
  session_name: 'Asian Session',
  is_valid: true
}
```

**Parameters:**
- `documentedTimeStr`: Trade time as string (ISO format or parseable date)
- `userUtcOffset`: UTC offset in hours (number, e.g., 3 for UTC+3, -4 for UTC-4)

**Returns:** `SessionDetectionResult` object with:
- `documented_trade_time`: Original input
- `user_timezone_offset`: UTC offset used
- `calculated_utc_time`: ISO UTC timestamp
- `session_name`: One of: "Asian Session", "London Session", "New York Session", "Off Session", "Unknown"
- `is_valid`: Boolean - success flag
- `error?`: Error message if validation failed

#### `isValidUtcOffset(offset): boolean`

Validates UTC offset is in range [-12, +14].

#### `formatUtcOffset(offset): string`

Formats offset for display: `"UTC+3"` or `"UTC-4"`.

#### `getUtcOffsetFromIanaTimezone(ianaTimezone): number`

Helper function to convert IANA timezone name (e.g., "America/New_York") to UTC offset hours.

---

### 2. `lib/services/trade-service.ts` (Integration)

Updated `createTrade()` function now:

1. Gets user's UTC offset from profile settings
2. Calls `detectTradeSession()` with trade time and offset
3. Stores detected `session_name` in trades table
4. Logs session detection results for debugging

**Enhanced `CreateTradeInput` interface:**

```typescript
interface CreateTradeInput {
  // ... existing fields ...
  /** Optional: User's UTC offset. If not provided, fetches from profile. */
  user_utc_offset?: number | null
}
```

**Example usage:**

```typescript
await createTrade({
  symbol: 'EURUSD',
  direction: 'long',
  entry_price: 1.0850,
  exit_price: 1.0875,
  quantity: 1,
  entry_time: '2024-01-15T08:30:00', // User's local time
  exit_time: '2024-01-15T09:15:00',
  pnl: 250,
  pnl_percent: 2.3,
  user_utc_offset: 3, // UTC+3
  // Trade is automatically assigned to 'Asian Session'
})
```

---

## Database Integration

### `trades` Table

The `session` column stores the detected session:

```sql
trades.session: TEXT
  Values: 'Asian Session' | 'London Session' | 'New York Session' | 'Off Session' | NULL
```

### `profiles` Table

User's UTC offset stored in preferences:

```json
profiles.preferences: {
  "utc_offset": 3  // UTC+3
}
```

When a trade is created without explicit `user_utc_offset`, the trade service automatically fetches this value from the user's profile.

---

## Handling Edge Cases

### Cross-Midnight Scenarios

The engine correctly handles day rollovers:

```typescript
// User UTC+8, enters 02:00
detectTradeSession('2024-01-15T02:00:00', 8)

// Calculation: 02:00 - 8 = 18:00 (previous day)
// 18:00 UTC → New York Session ✓

result.calculated_utc_time === '2024-01-14T18:00:00Z'
result.session_name === 'New York Session'
```

### Midnight Boundaries

Asian Session wraps around midnight (23:00-06:59 UTC):

```typescript
// 23:30 UTC
detectTradeSession('2024-01-15T23:30:00', 0)  // UTC+0
// Result: 'Asian Session' ✓

// 06:30 UTC
detectTradeSession('2024-01-15T06:30:00', 0)
// Result: 'Asian Session' ✓

// 07:00 UTC (exactly on boundary)
detectTradeSession('2024-01-15T07:00:00', 0)
// Result: 'London Session' ✓
```

### Missing or Invalid Data

If trade time or UTC offset is missing/invalid, returns `"Unknown"` with error message:

```typescript
detectTradeSession(null, 3)
// Result: session_name === 'Unknown', is_valid === false

detectTradeSession('2024-01-15T08:30:00', null)
// Result: session_name === 'Unknown', is_valid === false

detectTradeSession('invalid-date', 3)
// Result: session_name === 'Unknown', is_valid === false, error: "Invalid trade time format..."
```

---

## Validation Rules

Before assigning a session:

1. ✓ Read the user's selected UTC offset
2. ✓ Read the documented trade time
3. ✓ Convert documented time to UTC using formula
4. ✓ Compare UTC time against master UTC session schedule
5. ✓ Assign the matching session

If either trade time or timezone is missing: **Session = Unknown**

The system never guesses.

---

## Testing

### Unit Tests

Test the detection engine directly:

```typescript
import { detectTradeSession, SESSION_SCHEDULE } from '@/lib/session-detection-engine'

// Test 1: Asian Session
const result1 = detectTradeSession('2024-01-15T05:00:00', 3)
expect(result1.session_name).toBe('Asian Session')
expect(result1.calculated_utc_time).toContain('2024-01-15T02:00:00')

// Test 2: London Session
const result2 = detectTradeSession('2024-01-15T08:00:00', 3)
expect(result2.session_name).toBe('London Session')

// Test 3: New York Session
const result3 = detectTradeSession('2024-01-15T18:00:00', 3)
expect(result3.session_name).toBe('New York Session')

// Test 4: Off Session
const result4 = detectTradeSession('2024-01-15T22:30:00', 3)
expect(result4.session_name).toBe('Off Session')

// Test 5: Missing UTC offset
const result5 = detectTradeSession('2024-01-15T08:00:00', null)
expect(result5.session_name).toBe('Unknown')
expect(result5.is_valid).toBe(false)
```

### Integration Tests

Test with the trade service:

```typescript
import { createTrade } from '@/lib/services/trade-service'

// Create trade with explicit UTC offset
const trade = await createTrade({
  symbol: 'EURUSD',
  direction: 'long',
  entry_price: 1.0850,
  exit_price: 1.0875,
  quantity: 1,
  entry_time: '2024-01-15T08:30:00',
  exit_time: '2024-01-15T09:15:00',
  pnl: 250,
  pnl_percent: 2.3,
  user_utc_offset: 3, // UTC+3
})

expect(trade.session).toBe('Asian Session')
```

---

## Advanced Statistics Integration

The session data flows into Advanced Statistics:

```typescript
// lib/advancedStats.ts
export async function getBestSessions(userId: string, dateRange?: DateRange) {
  const { data: trades } = await supabase
    .from('trades')
    .select('session, net_pnl, status')
    .eq('user_id', userId)
    .eq('status', 'closed')

  // Group by session name
  const sessions = trades.reduce((acc, trade) => {
    const session = trade.session || 'Unknown'
    if (!acc[session]) {
      acc[session] = { trades: [], wins: 0, losses: 0 }
    }
    acc[session].trades.push(trade)
    if (trade.net_pnl > 0) acc[session].wins++
    else acc[session].losses++
    return acc
  }, {})

  return Object.entries(sessions).map(([name, stats]) => ({
    name,
    trades: stats.trades.length,
    wins: stats.wins,
    losses: stats.losses,
    winRate: (stats.wins / stats.trades.length) * 100,
    // ...
  }))
}
```

---

## Deployment Checklist

- [ ] `lib/session-detection-engine.ts` deployed
- [ ] `lib/services/trade-service.ts` updated
- [ ] User profile includes `preferences.utc_offset` setting
- [ ] `trades.session` column populated for new trades
- [ ] Advanced Stats using session data from trades table
- [ ] Backtest trades updated with session detection (optional)
- [ ] Error logging in place for debugging
- [ ] Tests passing (unit + integration)

---

## Debugging

Enable debug logging in trade service:

```typescript
// lib/services/trade-service.ts logs at creation time:
console.log('[v0] Detected session:', sessionName, 'from UTC offset:', userUtcOffset)
console.log('[v0] Session detection details:', {
  documented_time: detectionResult.documented_trade_time,
  utc_time: detectionResult.calculated_utc_time,
  session: detectionResult.session_name,
})
```

Check browser console or server logs to verify:
- UTC offset read from user profile
- Trade time correctly converted to UTC
- Session correctly classified

---

## FAQs

**Q: Why use UTC offset instead of IANA timezones?**
A: Simplicity and determinism. UTC offsets never change (no DST complications), are explicit, and directly match the master session schedule which uses UTC times.

**Q: Can session detection be retroactively applied?**
A: Yes. Rebuild the session for existing trades:
```sql
UPDATE trades
SET session = CASE
  WHEN EXTRACT(HOUR FROM entry_time AT TIME ZONE 'UTC') >= 23 OR 
       EXTRACT(HOUR FROM entry_time AT TIME ZONE 'UTC') < 7 
  THEN 'Asian Session'
  -- ... etc
  ELSE 'Off Session'
END
WHERE session IS NULL;
```

**Q: What if user changes their UTC offset?**
A: Existing trades retain their session classification (reproducible from original documented time + original offset). Future trades use the new offset.

**Q: How accurate is the session detection?**
A: 100% deterministic. Given the same documented time and UTC offset, the result is always the same.

---

## References

- Master Session Schedule: Defined in `SESSION_SCHEDULE` constant
- Conversion Formula: `UTC Time = Documented Time - User UTC Offset`
- Validation Rules: See "Validation Rules" section above
- Database Schema: `trades.session` column
