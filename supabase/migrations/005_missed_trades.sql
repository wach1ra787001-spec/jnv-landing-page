CREATE TABLE IF NOT EXISTS missed_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  anticipated_rr NUMERIC NOT NULL,
  timeframe TEXT NOT NULL,
  strategy TEXT NOT NULL,
  premarket_notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE missed_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own missed trades" ON missed_trades
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_missed_trades_user_account ON missed_trades(user_id, account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_missed_trades_account ON missed_trades(account_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON missed_trades TO authenticated;
