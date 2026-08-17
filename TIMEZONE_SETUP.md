# Timezone Infrastructure Setup - Complete Documentation

## Overview

This document describes the complete timezone infrastructure implemented to make JNV PRO timezone-aware. All timestamps are stored in UTC in the database and converted to the user's timezone for display. This is the single source of truth for all trading analytics, news event correlation, and session detection.

## Architecture

### Core Components

1. **TimeService** (`lib/services/time-service.ts`)
   - Centralized service for all timezone conversions
   - Single instance per user session
   - Handles UTC ↔ User Timezone conversions
   - Detects trading sessions (Asian, London, New York, Overlap)
   - Provides utilities for time calculations

2. **TimezoneContext** (`lib/context/timezone-context.tsx`)
   - React context providing TimeService to entire app
   - Automatic timezone detection on first render
   - Persistent state management

3. **TimezoneProvider** (`lib/context/timezone-context.tsx`)
   - Wraps entire app to provide timezone context
   - Initializes with detected or stored timezone

### Database

**profiles table** already has `timezone` column (IANA format)

**Stored in UTC:**
- trades.entry_time
- trades.exit_time  
- trade_journal.created_at
- all timestamps throughout app

**Retrieved/Converted:**
- All timestamps converted to user's timezone at display time

## Implementation Steps Completed

### ✓ 1. Created TimeService
- File: `lib/services/time-service.ts`
- Handles all timezone conversions
- Session detection logic
- Holding time calculations
- News time proximity checks
- Trade classification utilities

### ✓ 2. Created Timezone Utilities
- File: `lib/timezone-utils.ts`
- Browser timezone detection
- IANA timezone validation
- Common timezone list
- Display name generation
- Country code → timezone mapping

### ✓ 3. Created TimezoneContext & Provider
- File: `lib/context/timezone-context.tsx`
- `useTimezone()` hook - access both context + service
- `useTimeService()` hook - access service only
- Automatic detection on mount
- Wraps entire application

### ✓ 4. Updated Auth Flow
- File: `app/auth/sign-up/page.tsx`
  - Detects timezone on signup
  - Sends timezone in callback URL param
  
- File: `app/auth/callback/route.ts`
  - Stores detected timezone on first login
  - Falls back to server-side detection if needed

### ✓ 5. Updated Profile Settings
- File: `components/settings/profile-tab.tsx`
  - Uses IANA timezone format (e.g., "America/New_York")
  - Allows manual timezone selection
  - Updates profiles.timezone on save
  - Supports daylight savings automatically

## Usage Guide

### Basic Usage in Components

```typescript
'use client'

import { useTimeService } from '@/lib/context/timezone-context'

export function MyComponent() {
  const timeService = useTimeService()
  
  // Convert UTC timestamp to user timezone
  const userTime = timeService.toUserTime(utcDate)
  
  // Format in user's timezone
  const formatted = timeService.format(utcDate, 'MMM dd, yyyy HH:mm')
  
  // Detect session
  const session = timeService.getSessionFromUTC(tradeEntryTime)
  // Returns: 'asia' | 'london' | 'newyork' | 'overlap' | 'closed'
  
  return <div>{formatted}</div>
}
```

### Common Operations

```typescript
const timeService = useTimeService()

// 1. Display trade entry time in user's timezone
trade.entryTime = '2024-01-15T14:30:00Z' // UTC
const displayTime = timeService.format(trade.entryTime, 'MMM dd HH:mm')

// 2. Get holding time
const holdingMinutes = timeService.getHoldingTimeMinutes(
  trade.entryTime,
  trade.exitTime
)
const bucket = timeService.getHoldingTimeBucket(holdingMinutes)
// Returns: 'very-short' | 'short' | 'medium' | 'long' | 'very-long'

// 3. Detect trading session for a trade
const session = timeService.getSessionFromUTC(trade.entryTime)
const sessionInfo = timeService.getSessionInfo(session)
// sessionInfo = { name: 'London', utcStart: 7, utcEnd: 15 }

// 4. Check if trade was near news time
const nearNews = timeService.isNearNewsTime(trade.entryTime, 30) // 30 min window

// 5. Get timezone offset display
const offset = timeService.getTimezoneOffset()
// Returns: "UTC-5" or "UTC+1"

// 6. Format date only / time only
const dateStr = timeService.formatDate(trade.entryTime)
const timeStr = timeService.formatTime(trade.entryTime)

// 7. Get day boundaries in UTC for queries
const { start, end } = timeService.getDayBoundariesInUTC()
```

### Updating User's Timezone

```typescript
'use client'

import { useTimezone } from '@/lib/context/timezone-context'

export function TimezoneSelector() {
  const { setUserTimezone } = useTimezone()
  
  const handleChange = (newTimezone: string) => {
    setUserTimezone(newTimezone)
    // Update database
    await updateProfileTimezone(newTimezone)
  }
  
  return (
    <Select onValueChange={handleChange}>
      <SelectItem value="America/New_York">New York</SelectItem>
      <SelectItem value="Europe/London">London</SelectItem>
      {/* ... */}
    </Select>
  )
}
```

## Data Flow

```
User Signup
  ↓
Browser detects timezone (Intl API)
  ↓
Timezone sent to callback via URL param
  ↓
Auth callback stores in profiles.timezone (IANA format)
  ↓
On app load, TimezoneProvider initializes:
  - Reads profiles.timezone from database
  - Creates TimeService instance
  - Provides to entire app via context
  ↓
All components use timeService for conversions
  ↓
Database queries always use UTC
  ↓
Display layer converts to user's timezone
```

## Timezone Offsets Supported

The system now uses IANA timezone identifiers which automatically handle:
- Daylight Saving Time transitions
- Historical timezone changes
- Regional timezone variations

**Common timezones included:**
- Americas: New_York, Chicago, Denver, Los_Angeles, Toronto, Mexico_City, Buenos_Aires, Sao_Paulo
- Europe: London, Paris, Berlin, Amsterdam, Moscow, Zurich
- Asia: Tokyo, Shanghai, Hong_Kong, Singapore, Bangkok, Dubai, Kolkata, Jakarta
- Africa: Cairo, Johannesburg, Lagos, Nairobi
- Oceania: Sydney, Melbourne, Brisbane, Perth, Auckland, Fiji, Honolulu

## Next Steps for News Impact Statistics

Now that timezone infrastructure is complete:

1. **News Time Configuration** - Set up news_times_config table with accurate UTC times for each session's news releases
2. **News Event Matching** - Use TimeService to match trades to news times
3. **Performance Correlation** - Analyze PnL during news vs normal times
4. **Session Analytics** - Break down performance by trading session using getSessionFromUTC()

## Important Notes

- ⚠️ **Never** perform timezone calculations independently in components
- ✅ **Always** use TimeService for conversions
- 📅 **All timestamps** in database must be stored in UTC
- 🔄 **Daylight Savings** is handled automatically by IANA timezone database
- 🌍 **User's timezone** is the single source of truth for session detection
- 🔐 **No client-side storage** of timezone - always fetched from profiles table

## Testing

To test timezone functionality:

```typescript
// Test in browser console
const { timeService } = await import('@/lib/context/timezone-context')
timeService.format(new Date(), 'yyyy-MM-dd HH:mm:ss')
timeService.getSessionFromUTC(new Date())
```

## Troubleshooting

**Issue:** Timezone not updating after profile change
- Solution: Clear browser cache, refresh page, or trigger data refetch

**Issue:** Trading session showing as "closed"
- Solution: Verify UTC time is being used (not user's local time)

**Issue:** Timestamps showing wrong time
- Solution: Ensure trades table timestamps are in UTC
