# JNV | PRO Security Architecture

## Overview

This document outlines the backend-driven security architecture for JNV | PRO Trading Journal application. All sensitive operations, payments, subscriptions, and rate limiting are controlled exclusively on the backend to prevent unauthorized access or fraud.

## Core Principles

1. **Frontend Restrictions**: No secret keys, API authentication credentials, or subscription management
2. **Backend Authority**: All sensitive operations via Supabase Edge Functions
3. **Authentication Enforcement**: Every backend request validates user identity
4. **Database Security**: Row Level Security (RLS) on all tables
5. **Subscription Control**: Users can READ but never UPDATE subscription records

---

## Database Schema

### User-Editable Tables
These tables allow users to create, read, update, and delete their own data:
- `profiles` - User preferences, avatar, timezone (user-managed)
- `trades` - Trading records
- `trade_journal` - Notes and analysis
- `trade_metrics` - Calculated statistics
- `goals` - User goals
- `daily_summaries` - Daily insights
- `feedback` - User feedback

### Sensitive Tables (Read-Only for Users)
These tables are managed exclusively by the backend:
- `subscriptions` - User tier, limits, usage (SELECT only for users)
- `payments` - Payment history (SELECT only for users)
- `usage_logs` - API and feature usage audit trail
- `ai_request_logs` - AI coaching usage and costs

---

## Row Level Security (RLS) Policies

### Subscriptions Table
```sql
-- Users can ONLY SELECT their own subscription
CREATE POLICY "subscriptions_select_own" ON public.subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- No UPDATE, INSERT, or DELETE policies for users
-- Backend only manages subscriptions via service role
```

### Payments Table
```sql
-- Users can ONLY SELECT their own payments
CREATE POLICY "payments_select_own" ON public.payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Payments are read-only from user perspective
```

### Usage Logs
```sql
-- Users can INSERT their own logs (for some operations)
CREATE POLICY "usage_logs_insert_own" ON public.usage_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can SELECT their own logs
CREATE POLICY "usage_logs_select_own" ON public.usage_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);
```

---

## Backend Edge Functions

### 1. `check-subscription` Function
**Purpose**: Validate user subscription and feature access

**Location**: `/supabase/functions/check-subscription/index.ts`

**How It Works**:
1. Extracts user from JWT token
2. Fetches subscription record from database
3. Determines feature access based on tier
4. Returns usage limits and remaining requests

**Frontend Usage**:
```typescript
const response = await fetch('/api/subscription', {
  method: 'GET',
})
const { subscription, has_access, usage } = await response.json()
```

**Security**:
- Backend validates JWT token
- User can only see their own subscription
- Cannot modify subscription fields

---

### 2. `ai-coach` Function
**Purpose**: Process AI coaching requests with usage tracking

**Location**: `/supabase/functions/ai-coach/index.ts`

**How It Works**:
1. Validates user authentication
2. Checks subscription tier (free tier has limited access)
3. Verifies user hasn't exceeded AI request limit
4. Calls OpenAI API (secret key never exposed to frontend)
5. Logs request and decrements usage counter
6. Returns response with remaining requests

**Frontend Usage**:
```typescript
const response = await fetch('/api/ai-coach', {
  method: 'POST',
  body: JSON.stringify({ message: 'Help me analyze this trade' }),
})
const { message, requests_remaining } = await response.json()
```

**Rate Limiting**:
- Free tier: 100 AI requests/month
- Pro tier: 500 AI requests/month
- Premium tier: Unlimited

**Security**:
- OpenAI API key stored only in backend environment variables
- Usage decremented server-side, never by client
- Frontend cannot modify usage counts
- All requests logged for audit trail

---

## Frontend <-> Backend Flow

### Example: AI Coaching Request

```
Frontend                    Backend              Supabase
   |                          |                      |
   |--[POST /api/ai-coach]-->  |                      |
   |                          |--[validate JWT]-->  |
   |                          |<-[user data]-----  |
   |                          |                      |
   |                          |--[fetch subscription]->|
   |                          |<-[subscription]-----  |
   |                          |                      |
   |                 [Check: limits exceeded?]       |
   |                          |                      |
   |                          |--[OpenAI API Call]   |
   |                    (secret key on backend)      |
   |                          |                      |
   |                          |--[INSERT ai_logs]->|
   |                          |--[UPDATE subscriptions]->|
   |                          |--[INSERT usage_logs]->|
   |                          |                      |
   |<--[200 + response]-----  |                      |
   |                          |                      |
```

---

## Usage Tracking

### How It Works
1. **Server-Side Decrement**: When a user makes an AI request, the backend:
   - Increments `ai_requests_used` in subscriptions table
   - Inserts a row in `ai_request_logs` with tokens and cost
   - Inserts a row in `usage_logs` for audit trail

2. **Frontend Never Modifies Usage**: The frontend receives:
   - Current limits
   - Usage counts
   - Remaining requests (calculated server-side)
   - But cannot UPDATE these values

3. **Audit Trail**: Every operation is logged with:
   - Timestamp
   - User ID
   - Operation type
   - Metadata (tokens, cost, etc.)

### Database Tables

**subscriptions**:
```
{
  user_id,
  tier,                     // 'free', 'pro', 'premium'
  status,                   // 'active', 'canceled', 'past_due'
  ai_requests_limit,        // Max requests per month
  ai_requests_used,         // Incremented by backend only
  api_calls_limit,          // Max API calls per month
  api_calls_used,           // Incremented by backend only
  ...
}
```

**ai_request_logs**:
```
{
  user_id,
  request_type,             // 'coaching', 'analysis', 'feedback'
  prompt_tokens,
  completion_tokens,
  total_tokens,
  cost_usd,
  status,                   // 'success', 'error', 'failed'
  created_at
}
```

**usage_logs**:
```
{
  user_id,
  operation_type,           // 'ai_request', 'api_call', 'data_export'
  operation_count,
  metadata,                 // JSON with details
  created_at
}
```

---

## Subscription Tiers & Limits

### Free Tier
- Trade journal: ✅ Unlimited
- Trade analysis: ✅ Unlimited
- AI coaching: ⚠️ 100 requests/month
- Analytics: ❌ Limited
- API access: ❌

### Pro Tier
- Trade journal: ✅ Unlimited
- Trade analysis: ✅ Unlimited
- AI coaching: ✅ 500 requests/month
- Analytics: ✅ Full access
- API access: ⚠️ Limited

### Premium Tier
- Trade journal: ✅ Unlimited
- Trade analysis: ✅ Unlimited
- AI coaching: ✅ Unlimited
- Analytics: ✅ Advanced features
- API access: ✅ Full access

---

## Payment Processing

All payments are processed through Stripe:

1. **Frontend**: User selects plan, redirects to Stripe checkout
2. **Stripe Webhook**: On successful payment:
   - `check-subscription` Edge Function is called
   - Creates/updates subscription record
   - Inserts payment log
   - Sends confirmation email
3. **Frontend**: Refreshes subscription status

**Security**:
- Stripe handles all sensitive payment information
- Backend only receives payment confirmation
- Payment status is source of truth, not frontend claims

---

## Common Vulnerabilities & Mitigations

| Vulnerability | Attack | Mitigation |
|---|---|---|
| Client modifies usage | User sends `ai_requests_used: 0` | Backend validates from DB, ignores client values |
| Free tier bypass | User calls AI endpoint 1000 times | Backend checks limits before processing |
| Subscription downgrade | User modifies tier in localStorage | Only DB value matters, frontend caches only |
| Leaked API keys | Frontend hardcodes secret keys | Secrets only in backend env vars |
| Unlimited API calls | User calls API directly | Backend validates subscription tier |
| Payment fraud | User creates fake transaction | Stripe webhook is source of truth |

---

## Testing Checklist

- [ ] User cannot modify subscription tier via API
- [ ] AI requests are decremented server-side
- [ ] Free tier users are blocked from premium features
- [ ] OpenAI key is not exposed in frontend bundles
- [ ] Usage logs accurately reflect all requests
- [ ] Failed requests don't decrement limits
- [ ] Rate limiting prevents abuse
- [ ] Payment webhook correctly updates subscriptions
- [ ] RLS policies block cross-user data access
- [ ] Session tokens expire and are refreshed

---

## Debugging

To verify security implementation:

1. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
   ```

2. **Audit Usage**:
   ```sql
   SELECT * FROM usage_logs WHERE user_id = 'user-id' ORDER BY created_at DESC;
   ```

3. **Check Subscription State**:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'user-id';
   ```

4. **View API Logs**:
   ```sql
   SELECT * FROM ai_request_logs WHERE user_id = 'user-id' ORDER BY created_at DESC;
   ```

---

## Deployment

### Environment Variables Required

**Backend (Supabase Edge Functions)**:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
```

**Frontend (Next.js)**:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Never expose**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
