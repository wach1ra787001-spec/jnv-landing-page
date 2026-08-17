-- =============================================
-- TIME ANALYSIS SUPPORTING TABLES
-- =============================================

-- Table 1: Session Statistics (aggregated from trades)
-- Stores pre-calculated session performance metrics
CREATE TABLE IF NOT EXISTS session_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session TEXT NOT NULL, -- 'Asian', 'London', 'New York'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trades BIGINT DEFAULT 0,
  winning_trades BIGINT DEFAULT 0,
  losing_trades BIGINT DEFAULT 0,
  breakeven_trades BIGINT DEFAULT 0,
  win_rate_pct NUMERIC(5,2) DEFAULT 0, -- e.g., 55.50
  net_pnl NUMERIC(12,2) DEFAULT 0,
  gross_profit NUMERIC(12,2) DEFAULT 0,
  gross_loss NUMERIC(12,2) DEFAULT 0,
  avg_pnl NUMERIC(12,2) DEFAULT 0,
  avg_r_multiple NUMERIC(6,3) DEFAULT 0,
  profit_factor NUMERIC(8,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session, period_start, period_end)
);

-- Table 2: Holding Time Buckets (for holding time vs PnL analysis)
-- Categorizes trades into duration buckets with performance metrics
CREATE TABLE IF NOT EXISTS holding_time_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_bucket TEXT NOT NULL, -- 'Very Short (<5min)', 'Short (5-15min)', 'Medium (15-60min)', 'Long (1-4hr)', 'Very Long (4hr+)'
  bucket_min_minutes INTEGER NOT NULL,
  bucket_max_minutes INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trades BIGINT DEFAULT 0,
  winning_trades BIGINT DEFAULT 0,
  losing_trades BIGINT DEFAULT 0,
  win_rate_pct NUMERIC(5,2) DEFAULT 0,
  net_pnl NUMERIC(12,2) DEFAULT 0,
  avg_pnl NUMERIC(12,2) DEFAULT 0,
  avg_r_multiple NUMERIC(6,3) DEFAULT 0,
  profit_factor NUMERIC(8,3) DEFAULT 0,
  min_pnl NUMERIC(12,2),
  max_pnl NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, duration_bucket, period_start, period_end)
);

-- Table 3: News Time Impact Analysis
-- Tracks trade performance during news times vs non-news times
CREATE TABLE IF NOT EXISTS news_time_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  trade_type TEXT NOT NULL, -- 'news_time' or 'no_news'
  news_sessions TEXT, -- comma-separated: 'london,newyork,etc' or NULL for no-news
  total_trades BIGINT DEFAULT 0,
  winning_trades BIGINT DEFAULT 0,
  losing_trades BIGINT DEFAULT 0,
  win_rate_pct NUMERIC(5,2) DEFAULT 0,
  net_pnl NUMERIC(12,2) DEFAULT 0,
  gross_profit NUMERIC(12,2) DEFAULT 0,
  gross_loss NUMERIC(12,2) DEFAULT 0,
  avg_pnl NUMERIC(12,2) DEFAULT 0,
  avg_r_multiple NUMERIC(6,3) DEFAULT 0,
  profit_factor NUMERIC(8,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trade_type, period_start, period_end)
);

-- Table 4: Holding Time Detail (raw data for charts)
-- Stores individual trade duration vs PnL for scatter plots
CREATE TABLE IF NOT EXISTS holding_time_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  net_pnl NUMERIC(12,2) NOT NULL,
  r_multiple NUMERIC(6,3) NOT NULL,
  is_win BOOLEAN NOT NULL,
  symbol TEXT,
  direction TEXT, -- 'LONG' or 'SHORT'
  session TEXT,
  trade_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trade_id, period_start)
);

-- Table 5: News Times Reference
-- Reference table for major news times by session and UTC offset
CREATE TABLE IF NOT EXISTS news_times_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session TEXT NOT NULL UNIQUE, -- 'London', 'New York', 'Asian'
  time_utc_hhmm TEXT NOT NULL, -- e.g., '13:30' for London
  time_utc_minus4_hhmm TEXT NOT NULL, -- EST equivalent
  time_utc_minus5_hhmm TEXT NOT NULL, -- EDT equivalent
  description TEXT, -- e.g., 'UK Economic Data'
  impact_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 6: Monthly PnL (expanded for 12-month view)
-- Already exists, but ensure it has period_type column
-- ALTER TABLE monthly_pnl ADD COLUMN period_type TEXT DEFAULT 'monthly';

-- Table 7: Holding Time vs PnL Trends (for line graphs by duration)
-- Stores PnL progression for three holding time categories
CREATE TABLE IF NOT EXISTS holding_time_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  holding_category TEXT NOT NULL, -- 'less_holding', 'medium_holding', 'longer_holding'
  bucket_min_minutes INTEGER NOT NULL,
  bucket_max_minutes INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  trades_taken BIGINT DEFAULT 0,
  cumulative_pnl NUMERIC(12,2) DEFAULT 0,
  avg_pnl_per_trade NUMERIC(12,2) DEFAULT 0,
  win_rate_pct NUMERIC(5,2) DEFAULT 0,
  best_trade NUMERIC(12,2),
  worst_trade NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, holding_category, period_start, period_end)
);

-- Table 8: News-Time Profit/Loss Tracking
-- For the line graph showing profit/loss spikes near news times
CREATE TABLE IF NOT EXISTS news_pnl_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  session TEXT NOT NULL, -- 'London', 'New York', 'Asian'
  time_minutes_from_news INTEGER NOT NULL, -- negative = before, positive = after
  -- e.g., -30 to +30 in 5-minute buckets
  profit_trades BIGINT DEFAULT 0,
  loss_trades BIGINT DEFAULT 0,
  total_pnl NUMERIC(12,2) DEFAULT 0,
  win_rate_pct NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session, time_minutes_from_news, period_start)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_session_performance_user_period 
  ON session_performance(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_holding_time_buckets_user_period 
  ON holding_time_buckets(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_news_time_impact_user_period 
  ON news_time_impact(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_holding_time_trades_user_period 
  ON holding_time_trades(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_holding_time_trends_user_period 
  ON holding_time_trends(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_news_pnl_timeline_user_period 
  ON news_pnl_timeline(user_id, period_start, period_end);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE session_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding_time_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_time_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding_time_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_times_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding_time_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_pnl_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all new tables
CREATE POLICY "session_performance_users_own" 
  ON session_performance FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "holding_time_buckets_users_own" 
  ON holding_time_buckets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "news_time_impact_users_own" 
  ON news_time_impact FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "holding_time_trades_users_own" 
  ON holding_time_trades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "news_times_config_public_read" 
  ON news_times_config FOR SELECT USING (true);

CREATE POLICY "holding_time_trends_users_own" 
  ON holding_time_trends FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "news_pnl_timeline_users_own" 
  ON news_pnl_timeline FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- INSERT NEWS TIMES REFERENCE DATA
-- =============================================

INSERT INTO news_times_config (session, time_utc_hhmm, time_utc_minus4_hhmm, time_utc_minus5_hhmm, description, impact_level)
VALUES 
  ('London', '13:30', '08:30', '09:30', 'UK Economic Data Release', 'high'),
  ('New York', '20:30', '15:30', '16:30', 'US Economic Data Release', 'high'),
  ('Asian', '08:00', '03:00', '04:00', 'Asian Session Open', 'medium')
ON CONFLICT (session) DO NOTHING;
