# Economic Calendar - Quick Setup

## 1. Add Environment Variables

In Vercel project settings (top right → Settings → Vars):

```
CRON_SECRET = [Generate with: openssl rand -base64 32]
FMP_API_KEY = [Get free key from https://site.financialmodelingprep.com/developer/docs/]
```

## 2. Verify Database Table

The `economic_events` table was already created. Verify it exists:

```sql
SELECT * FROM economic_events LIMIT 1;
```

## 3. Deploy to Vercel

Push changes to your Git repo. Vercel automatically:
- Deploys your code
- Activates cron jobs
- First sync runs at 02:00 UTC tomorrow

## 4. Test the System

### Option A: Manual Sync (Immediate)
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/economic-calendar/sync
```

### Option B: Wait for Cron
- First sync: Tomorrow at 02:00 UTC
- First update: Every 15 minutes after first sync

### Option C: Check Database
```sql
SELECT COUNT(*) FROM economic_events;
SELECT * FROM economic_events ORDER BY created_at DESC LIMIT 5;
```

## 5. Verify News Impact Card

1. Go to **Dashboard → Advanced Stats → Time Analysis**
2. Scroll to **News Time Impact** card
3. Should show trades split into "Near News" vs "Normal Trading"
4. If empty: no closed trades yet, or events haven't loaded

## 6. Files to Know

| File | Purpose |
|------|---------|
| `lib/economicCalendar.ts` | Core utilities (server-only) |
| `app/api/economic-calendar/sync/route.ts` | Daily sync job (uses FMP API) |
| `app/api/economic-calendar/update-actuals/route.ts` | 15-min updates |
| `app/api/economic-calendar/events/route.ts` | Frontend read endpoint |
| `vercel.json` | Cron schedule |
| `ECONOMIC_CALENDAR_README.md` | Full documentation |

## 7. Common Issues

| Problem | Solution |
|---------|----------|
| No events appearing | Check CRON_SECRET and FMP_API_KEY in Vercel settings |
| News card shows 0 trades | Need closed trades first, or check trade entry times vs event times |
| Cron not running | Verify `vercel.json` exists at project root |
| Build fails | Make sure `'use server'` directive is in `economicCalendar.ts` |
| FMP API errors | Verify key is valid at https://site.financialmodelingprep.com/dashboard |

## 8. Data Window

- **Cron fetches:** Next 30 days (runs daily at 02:00 UTC)
- **News window:** 30 minutes before/after trade entry
- **Update check:** Last 48 hours (every 15 minutes)
- **Data source:** Financial Modeling Prep (FMP) - primarily US economic indicators

---

**Ready?** Deploy now and watch the News Time Impact card populate with real FMP economic data!
