# End-to-End Testing Guide

This guide walks you through testing the complete backend-connected trading journal system.

---

## Pre-Test Checklist

- [ ] You are logged in with a Supabase user account
- [ ] Supabase integration is connected (check Settings → Integrations)
- [ ] All environment variables are set
- [ ] Dev server is running (`pnpm dev`)
- [ ] Browser DevTools console is open

---

## Test 1: Dashboard Loads with Real Data

**Objective**: Verify the dashboard fetches real data from database

**Steps**:
1. Navigate to `/dashboard`
2. Look at the KPI cards (Total PnL, Win Rate, Total Trades)
3. Check browser console for `[v0]` logs
4. If you haven't added trades yet, you'll see 0 values (this is correct)

**Success Criteria**:
- ✅ Dashboard loads without errors
- ✅ Page shows your profile name
- ✅ Console shows no red errors
- ✅ KPI cards display metric values (can be 0 if new account)

---

## Test 2: Add Trade Manually

**Objective**: Verify the complete add-trade data flow

**Steps**:

### 2a: Navigate to Trade Journal
1. Click "Trade Journal" in sidebar
2. You should see either an empty state or existing trades
3. Click "Add Trade" or "Add Trade Manually" button

### 2b: Fill the Form
1. Symbol: `EURUSD`
2. Direction: `Buy`
3. Entry Price: `1.0850`
4. Exit Price: `1.0920`
5. Quantity: `1.0`
6. Entry Date: Today's date
7. Exit Date: Today's date
8. Notes (optional): "Test trade from guide"
9. Screenshots (optional): Can skip for now

### 2c: Submit
1. Click "Save Trade" button
2. Watch the console for `[v0]` logs

**Success Criteria**:
- ✅ Console shows: `[v0] Submitting trade:`
- ✅ Console shows: `[v0] Creating trade for user:`
- ✅ Toast notification appears: "Saving EURUSD trade..."
- ✅ Toast changes to: "Trade saved successfully"
- ✅ Modal closes automatically
- ✅ Trade appears at top of list immediately

---

## Test 3: Trade Persists in Database

**Objective**: Verify data actually saved to Supabase

**Steps**:

### 3a: Immediate Verification
1. The trade should appear in the Trade Journal list
2. See your symbol (EURUSD), direction (BUY), P&L, etc.

### 3b: Hard Refresh
1. Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to hard refresh
2. Login again if needed
3. Navigate to Trade Journal
4. **The trade should still be there** - this proves persistence

### 3c: Dashboard Metrics Update
1. Go to `/dashboard`
2. Check KPI cards
3. "Total Trades" should increment
4. If profitable, "Total PnL" should update
5. "Win Rate" should be recalculated

**Success Criteria**:
- ✅ Trade appears in list after hard refresh
- ✅ Dashboard metrics updated
- ✅ Console shows successful database query in all pages

---

## Test 4: Multiple Trades

**Objective**: Verify system handles multiple trades

**Steps**:
1. Go to Trade Journal
2. Add 3-5 trades with different symbols:
   - GBPUSD (Sell, small loss)
   - XAUUSD (Buy, profit)
   - USDJPY (Sell, profit)
   - EURGBP (Buy, loss)
3. Verify all appear in the list

**Success Criteria**:
- ✅ All trades display
- ✅ Most recent trade is at top
- ✅ P&L colors correct (green for profit, red for loss)
- ✅ Dashboard shows cumulative metrics

---

## Test 5: Error Handling

**Objective**: Verify graceful error handling

**Steps**:

### 5a: Missing Required Fields
1. Open "Add Trade" modal
2. Try submitting with empty symbol
3. Nothing should submit (form validation)

### 5b: Invalid Data
1. Fill form with all fields
2. Set Entry Price to "abc" (text)
3. Try submitting
4. Should see validation error or no submission

### 5c: Network Error (Advanced)
1. Open DevTools Network tab
2. Throttle network to "Offline"
3. Try adding a trade
4. Should see error toast: "Error saving trade"
5. Resume network and try again
6. Should work

**Success Criteria**:
- ✅ Invalid data doesn't submit silently
- ✅ Error toasts appear for failures
- ✅ User gets clear feedback on what went wrong

---

## Test 6: Console Logging

**Objective**: Verify debugging information is available

**Steps**:
1. Open browser console (F12)
2. Go to Trade Journal
3. You should see logs like:
   ```
   [v0] Fetching trades for user: a1b2c3d4-...
   [v0] Fetched trades: 5
   ```
4. Add a new trade
5. You should see:
   ```
   [v0] Submitting trade: { symbol: 'EURUSD', ... }
   [v0] API received trade data: { symbol: 'EURUSD', ... }
   [v0] Creating trade for user: a1b2c3d4-...
   [v0] Creating trade with data: { symbol: 'EURUSD', ... }
   [v0] Inserting into database: { ... }
   [v0] Trade created successfully: { id: '...', ... }
   ```

**Success Criteria**:
- ✅ Console shows `[v0]` prefixed logs
- ✅ No red error messages
- ✅ Logs show complete flow from UI to database

---

## Test 7: Authentication Verification

**Objective**: Verify user isolation and security

**Steps**:

### 7a: Check User Ownership
1. Add a trade as User A
2. Note the timestamp and details
3. Open Supabase dashboard
4. Go to "Editor" → "trades" table
5. Find your trade
6. Verify `user_id` column matches your user ID

### 7b: RLS Policy Check
1. Manually try to query another user's trades in Supabase console:
   ```sql
   SELECT * FROM trades WHERE user_id != 'your-user-id'
   ```
2. Should return 0 rows (RLS blocks it)

**Success Criteria**:
- ✅ Your trades have your user_id
- ✅ Trade data belongs to authenticated user
- ✅ RLS policies prevent cross-user access

---

## Test 8: Dashboard Data Flow

**Objective**: Verify dashboard pulls real trade data

**Steps**:

### 8a: Check Dashboard Page Logic
1. Open `/dashboard`
2. Right-click → "View Page Source"
3. Search for your trade symbol (e.g., "EURUSD")
4. If found in initial HTML, data was server-rendered correctly

### 8b: Monitor Network Requests
1. Open DevTools → Network tab
2. Go to `/dashboard`
3. Look for request to:
   - `trade_metrics` table query
   - `trades` table query
4. See response data includes your trades

### 8c: Check Displayed Metrics
1. Look at KPI cards
2. "Total Trades" should match count in database
3. "Win Rate" should be calculated from your trade P&Ls
4. "Total PnL" should sum all your trade P&Ls

**Success Criteria**:
- ✅ Dashboard queries execute successfully
- ✅ Metrics reflect actual trade data
- ✅ No hardcoded mock values displayed

---

## Debugging Tips

If something doesn't work, follow this checklist:

### Check Authentication
1. Are you logged in?
2. Run in console: `localStorage.getItem('sb-user')`
3. Should show your user object

### Check API Connection
1. Open Network tab
2. Submit a trade
3. Look for `POST /api/trades`
4. Response should be 201 with trade data
5. If error, check response body for error message

### Check Database Connection
1. Go to Supabase dashboard
2. Go to Editor → trades table
3. Can you see your trades in the table?
4. If not, check RLS policies are not blocking inserts

### Check Logs
1. Filter browser console by `[v0]`
2. Follow the log flow
3. Look for error messages
4. Copy full error and search docs

### Common Issues
```
// No trades appearing
→ Check fetchTrades() runs on useEffect
→ Check API returns 200 with data
→ Check user is authenticated

// Trade doesn't save
→ Check console for [v0] logs
→ Check entry_price, exit_price are numbers
→ Check API returns 201 status

// Dashboard doesn't update
→ Check TradeJournal fetchTrades() on mount
→ Check trades state updates after POST
→ Check Dashboard queries run successfully
```

---

## Full Integration Test (Recommended)

Do all tests in order:
1. ✅ Dashboard loads
2. ✅ Add first trade
3. ✅ Verify persistence (hard refresh)
4. ✅ Add multiple trades
5. ✅ Check dashboard metrics
6. ✅ Verify console logging
7. ✅ Check Supabase table directly
8. ✅ Verify RLS isolation

If all pass, the system is fully functional.

---

## Performance Notes

Typical timings:
- **Dashboard load**: 200-500ms
- **Fetch trades**: 100-300ms
- **Add trade**: 500ms-1s (includes modal animation)
- **Database query**: 50-150ms
- **API response**: 100-300ms

If timings are significantly longer, check:
- Network tab in DevTools
- Database query performance
- Browser performance (Settings → Throttling)

---

## When to Ask for Help

If you see these issues:
- `[v0] Error` in console with details
- Toast says "Error saving trade"
- Trade doesn't appear after waiting 5+ seconds
- Dashboard shows 0 trades even after adding them
- Supabase returns 401 Unauthorized

Then check the logs first, then refer to `BACKEND_AUDIT_REPAIR.md` troubleshooting section.
