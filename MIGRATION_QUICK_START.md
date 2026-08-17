# Database Migration - Quick Start Guide

## BEFORE YOU PROCEED
⚠️ **WARNING**: This migration will DELETE all existing tables and create a new schema. There is no rollback.

If you have important data in existing tables, EXPORT IT FIRST.

## The 3-Minute Migration

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New query"** button

### Step 2: Copy & Paste the Migration SQL
1. Open this file: `supabase/migrations/001_rebuild_schema.sql`
2. Select all text (Ctrl+A)
3. Copy (Ctrl+C)
4. In Supabase SQL Editor, click in the query text area
5. Paste (Ctrl+V)

### Step 3: Execute the Migration
1. Click the **"Run"** button (or press Ctrl+Enter)
2. Wait for execution to complete (should take 10-30 seconds)
3. Check the results panel for any errors

### Step 4: Verify Success
Run this verification query:

```sql
-- Check that new tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected output (8 tables):
- journal_trades
- personal_notes
- playbook_rules
- playbooks
- trade_attachments
- trade_tags
- trading_goals
- user_settings

## What Just Happened

✅ Deleted 8 old broken tables
✅ Created 8 new production tables
✅ Applied RLS (Row Level Security) policies to all tables
✅ Created performance indexes
✅ Database is now properly normalized

## Next: Test the App

1. Go back to your app (`http://localhost:3000`)
2. Sign in
3. Go to Trade Journal (`/dashboard/trade-journal`)
4. Click "Add Trade" button
5. Fill in a test trade:
   - Symbol: EURUSD
   - Direction: BUY
   - Entry Price: 1.08500
   - Exit Price: 1.08700
   - Quantity: 1.0
   - Entry Date: 24/05/2026
   - Exit Date: 24/05/2026
6. Click "Save Trade"

Expected result:
- Toast notification: "Trade saved successfully"
- Trade appears in the journal
- Go to Trade History - trade is there
- Hard refresh (Ctrl+Shift+R) - trade still there

If trades are not appearing, check:
1. Browser console for errors
2. Supabase logs for RLS policy errors
3. Verify user is signed in to correct account

## If Something Goes Wrong

**Error: "Table does not exist"**
- The migration didn't run successfully
- Check the SQL Editor results for errors
- Try running the migration again

**Error: "Permission denied"**
- RLS policy rejected the insert
- Check that you're signed in
- Verify user_id in auth.users table

**Trade submitted but doesn't appear**
- Open DevTools (F12)
- Go to Network tab
- Look for POST request to /api/trades
- Check response status (should be 201)
- Check response body for errors

## Safe to Delete (Old Tables)

These tables should now be gone (migration deleted them):
- ai_logs
- daily_summaries
- feedback
- goals
- trade_journal (old one)
- trade_metrics
- admins

## Safe to Keep (Not Touched)

These tables are preserved from original schema:
- profiles (already working)
- All other tables in different schema

## Emergency: Rollback

If you need to rollback (get old tables back):
1. Contact Supabase support
2. Request database backup restore to before migration timestamp
3. Or manually recreate old tables from backup

## Need Help?

Check these files:
- `docs/DATABASE_RECONSTRUCTION.md` - Complete technical details
- `app/api/trades/route.ts` - API endpoint code
- `lib/services/trade-service.ts` - Database service layer
- Browser console - debug logs prefixed with `[v0]`

Good luck! 🚀
