-- JNV | PRO Subscriptions & Security Schema
-- Separate sensitive subscription data from user profiles per security guidelines

-- Subscriptions table (read-only for users, managed by backend)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Usage tracking (decremented server-side only)
  ai_requests_limit INTEGER DEFAULT 100,
  ai_requests_used INTEGER DEFAULT 0,
  api_calls_limit INTEGER DEFAULT 1000,
  api_calls_used INTEGER DEFAULT 0,
  monthly_data_export_limit INTEGER DEFAULT 10,
  monthly_data_export_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs table (audit trail for all API calls)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL, -- 'ai_request', 'api_call', 'data_export', etc.
  operation_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI request logs (track tokens and costs)
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('coaching', 'analysis', 'feedback', 'summary')),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 4),
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table (read-only for users)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL, -- Store in cents to avoid float issues
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'processing', 'requires_payment_method', 'failed')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON public.ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON public.ai_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can ONLY READ their own subscription
-- They cannot UPDATE, INSERT, or DELETE subscription records
CREATE POLICY "subscriptions_select_own" ON public.subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policies: Users cannot modify subscriptions directly
-- Only backend functions can update via service role

-- RLS Policies: Users can READ their own usage logs
CREATE POLICY "usage_logs_select_own" ON public.usage_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Usage logs are INSERT-only (no UPDATE/DELETE from users)
CREATE POLICY "usage_logs_insert_own" ON public.usage_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can READ their own AI request logs
CREATE POLICY "ai_request_logs_select_own" ON public.ai_request_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- AI request logs are INSERT-only (backend creates them)
CREATE POLICY "ai_request_logs_insert_own" ON public.ai_request_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can READ their own payments
CREATE POLICY "payments_select_own" ON public.payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Payments are read-only for users
