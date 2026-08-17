# FMP Economic Data - Deployment Checklist

## Pre-Deployment (Local)

- [ ] **Verify code compiles:**
  ```bash
  pnpm build
  ```
  Expected: "✓ Compiled successfully"

- [ ] **Verify new files exist:**
  - [ ] `/scripts/fetch-fmp-economic-data.mjs`
  - [ ] `/app/api/manual-sync/route.ts`
  - [ ] `/lib/session-detection-engine.ts`
  - [ ] `/MANUAL_FMP_SYNC_GUIDE.md`
  - [ ] `/FMP_DATA_FETCH_SUMMARY.md`

- [ ] **Verify `vercel.json` has cron config:**
  ```bash
  grep -A 5 "crons" vercel.json
  ```

## Deployment to Vercel

### Step 1: Push to Git

```bash
git add .
git commit -m "Add FMP economic calendar data sync and trade session detection"
git push origin main
```

- [ ] Code pushed to GitHub
- [ ] Vercel automatically triggered deployment

### Step 2: Add Environment Variables

Go to **Vercel Dashboard → Project → Settings → Environment Variables**

Add these three variables:

| Variable | Value | Get From |
|----------|-------|----------|
| `FMP_API_KEY` | `fmp_abcdef123456` | https://site.financialmodelingprep.com/developer/docs/ |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase Dashboard → Settings → API |
| `CRON_SECRET` | Generate with: `openssl rand -base64 32` | Generate new |

- [ ] All 4 environment variables added
- [ ] "Production" environment selected for all
- [ ] "Redeploy" clicked after adding variables

### Step 3: Verify Deployment

```bash
# Check deployment status
vercel deploy --prod

# Or check Vercel Dashboard → Deployments
```

- [ ] Deployment successful (Green checkmark)
- [ ] No build errors
- [ ] All functions deployed

## Post-Deployment Verification

### Test 1: Verify Cron Job Created

```bash
# Check Vercel logs for cron execution
vercel logs https://your-domain.vercel.app --follow
```

Expected log entries:
```
[02:00 UTC] GET /api/economic-calendar/sync
[EconomicCalendar] Syncing events...
[EconomicCalendar] Fetched 500 events from FMP
```

- [ ] Cron job appears in Vercel logs
- [ ] Runs at 02:00 UTC (or check next day)

### Test 2: Manual API Sync

```bash
curl -X POST https://your-domain.vercel.app/api/manual-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_auth_token"
```

Expected response:
```json
{
  "success": true,
  "summary": {
    "fetched_from_fmp": 500,
    "filtered_high_impact": 187,
    "saved_to_db": 187,
    "date_range": {"from": "2024-06-09", "to": "2024-07-09"}
  }
}
```

- [ ] Manual sync endpoint working
- [ ] Events fetched from FMP
- [ ] Events saved to database

### Test 3: Database Verification

In Supabase SQL Editor:

```sql
-- Check economic events were saved
SELECT COUNT(*) as total_events FROM economic_events WHERE source = 'fmp';
-- Expected: > 100

-- Check by impact level
SELECT impact, COUNT(*) FROM economic_events WHERE source = 'fmp' GROUP BY impact;
-- Expected: high: ~80, medium: ~60, low: ~40

-- Check recent events
SELECT event_name, event_time_utc, impact FROM economic_events 
WHERE source = 'fmp' 
ORDER BY event_time_utc DESC 
LIMIT 10;
```

- [ ] Total FMP events in database > 100
- [ ] Events have impact levels assigned
- [ ] Recent events visible

### Test 4: Dashboard Integration

1. **Log into JNV Pro dashboard**
2. **Navigate to:** Dashboard → Advanced Stats → Time Analysis
3. **Verify:**
   - [ ] "News Time Impact" card is visible
   - [ ] Shows "Trading Near News" vs "Normal Trading" statistics
   - [ ] If empty: Create a closed trade first, then check again

### Test 5: Create Test Trade

Create a test trade to verify session detection + news correlation:

```bash
POST /api/trades
{
  "symbol": "EURUSD",
  "direction": "long",
  "entry_price": 1.0950,
  "exit_price": 1.0970,
  "quantity": 1,
  "entry_time": "2024-06-15T12:15:00Z",
  "exit_time": "2024-06-15T13:45:00Z",
  "pnl": 200,
  "pnl_percent": 1.83,
  "user_utc_offset": 3,
  "source": "manual"
}
```

Expected:
- [ ] Trade created successfully
- [ ] Session detected (check database: should be "New York" or similar)
- [ ] News correlation checked (check database: should have nearest_event data)

## Monitoring

### Daily Checks (First Week)

**Time: 02:05 UTC (5 min after sync)**

```bash
# Check logs
vercel logs https://your-domain.vercel.app --follow

# Query database
SELECT MAX(updated_at) FROM economic_events WHERE source = 'fmp';
```

- [ ] Cron job ran successfully
- [ ] Latest updated_at timestamp is today
- [ ] No error logs

### Weekly Checks

- [ ] Total FMP events in database is growing (old events removed after 30 days)
- [ ] "Actual" values being populated as events release
- [ ] News Time Impact card showing statistics correctly

## Rollback Plan

If something breaks:

### Option 1: Revert Code
```bash
git revert HEAD
git push origin main
```

### Option 2: Disable Cron Temporarily
Remove or comment out in `vercel.json`:
```json
{
  "crons": []  // Disabled temporarily
}
```

### Option 3: Clear Economic Data
```sql
DELETE FROM economic_events WHERE source = 'fmp';
```

## Troubleshooting

### Cron Not Running?

**Check:**
1. Vercel Dashboard → Deployments → select latest
2. Look for "Cron Events" section
3. Should show scheduled times

**If not showing:**
- Redeploy: `vercel deploy --prod`
- Wait for next 02:00 UTC
- Check logs: `vercel logs`

### No Economic Data in Dashboard?

**Check:**
1. Are there closed trades? (Need at least 1)
2. Is FMP data in database? (See "Test 3" above)
3. Is UTC offset saved for user? (Check profiles table)

**Fix:**
- Run manual sync: `POST /api/manual-sync`
- Wait 30 seconds, refresh dashboard
- Check browser console for errors

### Manual Sync Returns 403?

**Check:**
- FMP API key is valid (test at https://site.financialmodelingprep.com/dashboard)
- Key has access to economic-calendar endpoint
- Account not rate-limited

**Fix:**
- Generate new FMP key
- Add to Vercel environment variables
- Redeploy

### Database Connection Errors?

**Check:**
- SUPABASE_SERVICE_ROLE_KEY is correct (from Settings → API)
- NEXT_PUBLIC_SUPABASE_URL is correct (from Settings → API)
- Supabase project is active (not paused)

**Fix:**
- Copy credentials again from Supabase
- Update Vercel environment variables
- Redeploy

## Success Indicators

✓ All systems working if you see:

1. **In Vercel Logs:**
   ```
   [02:00 UTC] GET /api/economic-calendar/sync 200
   [EconomicCalendar] Synced 187 events successfully
   ```

2. **In Database:**
   ```
   SELECT COUNT(*) FROM economic_events WHERE source = 'fmp';
   Result: 185+ rows
   ```

3. **In Dashboard:**
   - News Time Impact card shows data
   - Example: "Trading Near News: 42% win rate vs Normal: 54%"

4. **In Trade Creation:**
   - Session automatically detected and saved
   - Trades tagged with news proximity

## Next Steps After Deployment

1. **Monitor first sync** (tomorrow at 02:00 UTC)
2. **Create a few test trades** to verify session detection
3. **Review dashboard** to confirm news correlation
4. **Update trading strategy** based on news impact insights

## Support Resources

- **FMP API Docs:** https://financialmodelingprep.com/api/v3/economic-calendar
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Cron:** https://vercel.com/docs/cron-jobs
- **Full Guide:** See `MANUAL_FMP_SYNC_GUIDE.md`

---

## Sign-Off Checklist

- [ ] All environment variables added to Vercel
- [ ] Code deployed successfully
- [ ] Cron jobs visible in Vercel dashboard
- [ ] Manual sync endpoint responding
- [ ] Economic events in database
- [ ] Dashboard showing News Time Impact data
- [ ] Test trade created and session detected
- [ ] Team notified of deployment

**Status:** ✓ Ready for Production
