ALTER TABLE public.missed_trades
  ADD COLUMN IF NOT EXISTS missed_trade_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_missed_trades_user_missed_trade_at
  ON public.missed_trades (user_id, missed_trade_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.missed_trades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missed_trades TO service_role;
