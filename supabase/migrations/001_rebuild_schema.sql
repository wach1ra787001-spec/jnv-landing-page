-- Complete database schema rebuild
-- This migration deletes broken tables and creates the new production schema

-- DROP BROKEN TABLES (in dependency order)
DROP TABLE IF EXISTS public.ai_logs CASCADE;
DROP TABLE IF EXISTS public.daily_summaries CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.trade_journal CASCADE;
DROP TABLE IF EXISTS public.trade_metrics CASCADE;
DROP TABLE IF EXISTS public.trade_attachments CASCADE;
DROP TABLE IF EXISTS public.trade_tags CASCADE;
DROP TABLE IF EXISTS public.trades CASCADE;
DROP TABLE IF EXISTS public.playbook_rules CASCADE;
DROP TABLE IF EXISTS public.playbooks CASCADE;
DROP TABLE IF EXISTS public.personal_notes CASCADE;
DROP TABLE IF EXISTS public.trading_goals CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- =====================================================
-- NEW PRODUCTION SCHEMA
-- =====================================================

-- 1. USER SETTINGS TABLE
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  timezone TEXT DEFAULT 'UTC',
  notifications_enabled BOOLEAN DEFAULT true,
  dashboard_layout TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MAIN JOURNAL TRADES TABLE (Source of truth)
CREATE TABLE public.journal_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trade details
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  
  -- Risk & P&L
  risk_amount NUMERIC,
  pnl NUMERIC,
  pnl_percent NUMERIC,
  
  -- Timing
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Trading context
  setup_type TEXT,
  market_condition TEXT,
  emotions TEXT,
  
  -- Analysis & Learning
  notes TEXT,
  lessons_learned TEXT,
  
  -- Media
  screenshots TEXT[] DEFAULT '{}',
  
  -- Metadata
  status TEXT DEFAULT 'CLOSED' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PLAYBOOKS TABLE
CREATE TABLE public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PLAYBOOK RULES TABLE
CREATE TABLE public.playbook_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PERSONAL NOTES TABLE
CREATE TABLE public.personal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TRADING GOALS TABLE
CREATE TABLE public.trading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_progress NUMERIC DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TRADE TAGS TABLE
CREATE TABLE public.trade_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.journal_trades(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- 8. TRADE ATTACHMENTS TABLE
CREATE TABLE public.trade_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.journal_trades(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_journal_trades_user_id ON public.journal_trades(user_id);
CREATE INDEX idx_journal_trades_created_at ON public.journal_trades(created_at);
CREATE INDEX idx_journal_trades_symbol ON public.journal_trades(symbol);
CREATE INDEX idx_playbooks_user_id ON public.playbooks(user_id);
CREATE INDEX idx_personal_notes_user_id ON public.personal_notes(user_id);
CREATE INDEX idx_trading_goals_user_id ON public.trading_goals(user_id);
CREATE INDEX idx_trade_tags_trade_id ON public.trade_tags(trade_id);
CREATE INDEX idx_trade_attachments_trade_id ON public.trade_attachments(trade_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_attachments ENABLE ROW LEVEL SECURITY;

-- USER SETTINGS POLICIES
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- JOURNAL TRADES POLICIES
CREATE POLICY "Users can view own trades"
  ON public.journal_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON public.journal_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON public.journal_trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades"
  ON public.journal_trades FOR DELETE
  USING (auth.uid() = user_id);

-- PLAYBOOKS POLICIES
CREATE POLICY "Users can view own playbooks"
  ON public.playbooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own playbooks"
  ON public.playbooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playbooks"
  ON public.playbooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playbooks"
  ON public.playbooks FOR DELETE
  USING (auth.uid() = user_id);

-- PLAYBOOK RULES POLICIES (accessed through playbooks)
CREATE POLICY "Users can view playbook rules"
  ON public.playbook_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playbooks
      WHERE playbooks.id = playbook_rules.playbook_id
      AND playbooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert playbook rules"
  ON public.playbook_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playbooks
      WHERE playbooks.id = playbook_rules.playbook_id
      AND playbooks.user_id = auth.uid()
    )
  );

-- PERSONAL NOTES POLICIES
CREATE POLICY "Users can view own notes"
  ON public.personal_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.personal_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.personal_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.personal_notes FOR DELETE
  USING (auth.uid() = user_id);

-- TRADING GOALS POLICIES
CREATE POLICY "Users can view own goals"
  ON public.trading_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.trading_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.trading_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.trading_goals FOR DELETE
  USING (auth.uid() = user_id);

-- TRADE TAGS POLICIES (accessed through trades)
CREATE POLICY "Users can view trade tags"
  ON public.trade_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_trades
      WHERE journal_trades.id = trade_tags.trade_id
      AND journal_trades.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trade tags"
  ON public.trade_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_trades
      WHERE journal_trades.id = trade_tags.trade_id
      AND journal_trades.user_id = auth.uid()
    )
  );

-- TRADE ATTACHMENTS POLICIES (accessed through trades)
CREATE POLICY "Users can view trade attachments"
  ON public.trade_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_trades
      WHERE journal_trades.id = trade_attachments.trade_id
      AND journal_trades.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trade attachments"
  ON public.trade_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_trades
      WHERE journal_trades.id = trade_attachments.trade_id
      AND journal_trades.user_id = auth.uid()
    )
  );
