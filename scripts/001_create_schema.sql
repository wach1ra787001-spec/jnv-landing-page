-- JNV | PRO Database Schema
-- Create profiles table linked to auth.users

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT,
  mt5_connected BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8),
  take_profit DECIMAL(20, 8),
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'canceled')),
  pnl DECIMAL(20, 2),
  pnl_percent DECIMAL(10, 4),
  commission DECIMAL(20, 2) DEFAULT 0,
  swap DECIMAL(20, 2) DEFAULT 0,
  risk_amount DECIMAL(20, 2),
  risk_percent DECIMAL(10, 4),
  r_multiple DECIMAL(10, 4),
  strategy TEXT,
  setup_type TEXT,
  timeframe TEXT,
  mt5_ticket TEXT,
  mt5_magic TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'mt5', 'api')),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade journal entries (notes, emotions, screenshots)
CREATE TABLE IF NOT EXISTS public.trade_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('pre_trade', 'during_trade', 'post_trade', 'daily', 'weekly')),
  content TEXT,
  emotions TEXT[],
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
  market_conditions TEXT,
  lessons_learned TEXT,
  screenshot_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade metrics (calculated stats per user)
CREATE TABLE IF NOT EXISTS public.trade_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(10, 4),
  profit_factor DECIMAL(10, 4),
  total_pnl DECIMAL(20, 2) DEFAULT 0,
  average_win DECIMAL(20, 2),
  average_loss DECIMAL(20, 2),
  largest_win DECIMAL(20, 2),
  largest_loss DECIMAL(20, 2),
  average_rr DECIMAL(10, 4),
  expectancy DECIMAL(20, 2),
  max_drawdown DECIMAL(10, 4),
  max_drawdown_amount DECIMAL(20, 2),
  consecutive_wins INTEGER DEFAULT 0,
  consecutive_losses INTEGER DEFAULT 0,
  sharpe_ratio DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'custom')),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('pnl', 'win_rate', 'trades_count', 'risk_management', 'custom')),
  target_value DECIMAL(20, 4) NOT NULL,
  current_value DECIMAL(20, 4) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily summaries (for AI insights)
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  trades_count INTEGER DEFAULT 0,
  pnl DECIMAL(20, 2) DEFAULT 0,
  win_rate DECIMAL(10, 4),
  emotional_state TEXT,
  ai_insights TEXT,
  key_takeaways TEXT[],
  improvement_areas TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);

-- AI conversation logs
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('coaching', 'analysis', 'feedback')),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON public.trades(entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trade_journal_user_id ON public.trade_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_journal_trade_id ON public.trade_journal(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_metrics_user_period ON public.trade_metrics(user_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for trades
CREATE POLICY "trades_select_own" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trades_insert_own" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trades_update_own" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trades_delete_own" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trade_journal
CREATE POLICY "trade_journal_select_own" ON public.trade_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trade_journal_insert_own" ON public.trade_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trade_journal_update_own" ON public.trade_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trade_journal_delete_own" ON public.trade_journal FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trade_metrics
CREATE POLICY "trade_metrics_select_own" ON public.trade_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trade_metrics_insert_own" ON public.trade_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trade_metrics_update_own" ON public.trade_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trade_metrics_delete_own" ON public.trade_metrics FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goals
CREATE POLICY "goals_select_own" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for daily_summaries
CREATE POLICY "daily_summaries_select_own" ON public.daily_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_summaries_insert_own" ON public.daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_summaries_update_own" ON public.daily_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_summaries_delete_own" ON public.daily_summaries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_logs
CREATE POLICY "ai_logs_select_own" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_insert_own" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for feedback
CREATE POLICY "feedback_select_own" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback_insert_own" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
