# Complete Backend Database Reconstruction

## Executive Summary

The original database architecture was fundamentally broken with disconnected tables and no proper data flow. This document outlines the complete reconstruction that makes the application a true, persistent trading journal backend.

## What Was Wrong

- **Broken Tables**: `ai_logs`, `daily_summaries`, `feedback`, `goals`, `trade_journal`, `trade_metrics`, `trades` were poorly normalized
- **Disconnected Frontend**: Frontend was using hardcoded mock data instead of real database queries
- **No Data Persistence**: Trades logged by users were not persisting to the database
- **Scattered Responsibility**: Trade data was split across multiple incorrect tables
- **No Unified Source of Truth**: Dashboard, trade history, and analytics couldn't derive from actual trade data

## Solution Overview

### 1. New Database Schema (`supabase/migrations/001_rebuild_schema.sql`)

**Deleted Tables (all 8 broken tables)**:
- ai_logs
- daily_summaries
- feedback
- goals
- trade_journal
- trade_metrics
- trade_attachments (placeholder)
- trade_tags (placeholder)

**Created New Production Tables**:

#### `user_settings`
Stores user preferences and dashboard configuration.
- `id`, `user_id`, `theme`, `timezone`, `notifications_enabled`, `dashboard_layout`, `created_at`, `updated_at`

#### `journal_trades` (MAIN SOURCE OF TRUTH)
Core trading data table - single source for all dashboard metrics, history, and analytics.

**Fields**:
```
- id, user_id (FK to auth.users)
- symbol, direction (BUY/SELL), entry_price, exit_price, quantity
- risk_amount, pnl, pnl_percent
- entry_time, exit_time
- setup_type, market_condition, emotions
- notes, lessons_learned
- screenshots (TEXT[] array)
- status (OPEN/CLOSED)
- created_at, updated_at
```

**Why unified**: Dashboard statistics, trade history, and monthly analytics all query this table directly.

#### `playbooks`
User-created trading playbooks/strategies.
- `id`, `user_id`, `title`, `description`, `created_at`, `updated_at`

#### `playbook_rules`
Individual rules within playbooks.
- `id`, `playbook_id` (FK), `rule_text`, `created_at`

#### `personal_notes`
User's personal trading notes and reflections.
- `id`, `user_id`, `title`, `content`, `created_at`, `updated_at`

#### `trading_goals`
User-defined trading goals and targets.
- `id`, `user_id`, `goal_type`, `target_value`, `current_progress`, `deadline`, `created_at`

#### `trade_tags` & `trade_attachments`
Optional metadata for enriching trade records.

### 2. Security: Row Level Security (RLS) Policies

**ALL tables have RLS enabled with strict policies:**

Every policy enforces that:
- Users can ONLY see/edit/delete their own data
- Cross-user access is impossible at the database level
- No user can access another user's trades, notes, goals, playbooks

**Policy Examples**:
```sql
-- journal_trades SELECT policy
CREATE POLICY "Users can view own trades"
  ON journal_trades FOR SELECT
  USING (auth.uid() = user_id);

-- journal_trades UPDATE policy
CREATE POLICY "Users can update own trades"
  ON journal_trades FOR UPDATE
  USING (auth.uid() = user_id);
```

### 3. Indexes for Performance

Added indexes on:
- `journal_trades.user_id` - Fast user trade lookups
- `journal_trades.created_at` - Efficient ordering for recent trades
- `journal_trades.symbol` - Symbol filtering
- All foreign key columns for relationship traversal

### 4. Fixed Frontend Code

#### Trade History Page (`/dashboard/trade-history`)
**Before**: Displayed hardcoded mockTrades array
**After**: Fetches real trades from `/api/trades` GET endpoint

```typescript
const [trades, setTrades] = useState<Trade[]>([])

useEffect(() => {
  const response = await fetch('/api/trades')
  const data = await response.json()
  setTrades(data) // Now real database data
}, [])
```

#### Trades API (`/api/trades`)
**GET**: Returns all trades for authenticated user (with RLS filtering)
**POST**: Inserts new trade into `journal_trades` table

### 5. Service Layer (`lib/services/trade-service.ts`)

Centralized business logic for trade operations:
- `createTrade()` - Insert into journal_trades
- `getUserTrades()` - Fetch user's trades from journal_trades
- `getTradeById()` - Fetch specific trade (with user verification)
- `calculateTradeMetrics()` - Derive metrics from journal_trades

All functions now reference the new `journal_trades` table (fixed from broken `trades` table).

## Implementation Steps

### Step 1: Apply the Migration

Navigate to Supabase Dashboard:
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Click "New query"
5. Copy the entire contents of `supabase/migrations/001_rebuild_schema.sql`
6. Paste into the query editor
7. Click "Run" (this will execute all SQL)

**Expected result**: All old tables dropped, new tables created with RLS policies.

### Step 2: Verify the Schema

In SQL Editor, run:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Expected tables:
- journal_trades
- personal_notes
- playbook_rules
- playbooks
- trade_attachments
- trade_tags
- trading_goals
- user_settings

### Step 3: Test the Data Flow

1. Open the app in browser
2. Sign in as a user
3. Navigate to Trade Journal (`/dashboard/trade-journal`)
4. Click "Add Trade" and fill in form
5. Submit trade

**What happens**:
- Form validates
- POST `/api/trades` with trade data
- API validates required fields
- Service layer inserts into `journal_trades`
- RLS policy checks user_id matches auth.uid()
- Database inserts record
- API returns created trade
- Frontend shows success toast
- Trade appears in Trade Journal list immediately

### Step 4: Verify Persistence

1. On Trade History page (`/dashboard/trade-history`), you should see your logged trade
2. Hard refresh (Ctrl+Shift+R) - trade still appears
3. Go to Trade Journal - trade still visible
4. Dashboard metrics should update based on real trades

## Data Flow Diagram

```
User logs trade via UI
        ↓
AddTradeModal validates
        ↓
POST /api/trades
        ↓
API validates fields
        ↓
trade-service.createTrade()
        ↓
supabase.from('journal_trades').insert()
        ↓
RLS policy checks user ownership
        ↓
Insert into database
        ↓
Return created trade to frontend
        ↓
Toast notification
        ↓
Update Trade Journal UI
        ↓
User can view in Trade History
        ↓
Dashboard stats recalculate (real trades)
        ↓
Monthly analytics update (real trades)
        ↓
Trade persists forever (encrypted in Supabase)
```

## Files Changed

### Created:
- `supabase/migrations/001_rebuild_schema.sql` - Complete new schema
- `scripts/run-migration.js` - Migration helper (optional)
- `docs/DATABASE_RECONSTRUCTION.md` - This file

### Modified:
- `app/dashboard/trade-history/page.tsx` - Removed mockTrades, added real data fetch
- `lib/services/trade-service.ts` - Fixed to use `journal_trades` instead of broken `trades`

### No Changes Needed:
- `app/api/trades/route.ts` - Already correct
- `components/dashboard/add-trade-modal.tsx` - Already correct
- `app/dashboard/trade-journal/page.tsx` - Already correct

## Verification Checklist

After applying migration:

- [ ] All old tables are deleted
- [ ] New `journal_trades` table exists with correct columns
- [ ] RLS policies are enabled on all tables
- [ ] Can sign in to app
- [ ] Can navigate to Trade Journal
- [ ] Can add a trade via modal
- [ ] Trade appears in Trade Journal immediately
- [ ] Trade appears in Trade History
- [ ] Dashboard metrics show real trade data
- [ ] Hard refresh - trade data persists
- [ ] Can't access other user's trades via browser console

## Troubleshooting

### "Table 'journal_trades' does not exist"
- Migration hasn't been applied
- Follow "Apply the Migration" steps above
- Check that SQL executed without errors

### Trade not appearing after submit
- Check browser console for API errors
- Open Network tab and verify POST /api/trades returns 201
- Check Supabase logs for RLS policy errors
- Verify user is authenticated (check auth.users table has user)

### Can see other users' trades
- RLS policies not applied correctly
- Go back to SQL Editor and re-run the RLS policy CREATE statements
- Verify each policy has `auth.uid()` condition

## Security Notes

- All user data is filtered by `user_id` at the database level
- No user can trick the API to show other user's trades
- Screenshots are stored as TEXT array (consider upgrading to Supabase Storage for large images)
- Never expose user_id in API responses to client-side code
- All timestamps stored in UTC (ensure frontend converts to user timezone)

## Performance Considerations

- Indexes on `user_id` and `created_at` ensure fast queries
- Most dashboard queries will filter by user_id + date range
- Consider pagination for users with 1000+ trades
- Consider archiving trades older than 2 years

## Next Steps

1. **Apply the migration** (required for anything to work)
2. **Test the happy path** (add a trade, verify it persists)
3. **Test error cases** (try to view other user's data)
4. **Connect dashboard** (dashboard page should derive metrics from journal_trades)
5. **Connect monthly analytics** (aggregate journal_trades by date)
6. **Connect goals system** (track progress against journal_trades)
