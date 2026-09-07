ALTER TABLE missed_trades ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'buy';
ALTER TABLE missed_trades DROP CONSTRAINT IF EXISTS missed_trades_direction_check;
ALTER TABLE missed_trades ADD CONSTRAINT missed_trades_direction_check CHECK (lower(direction) IN ('buy', 'sell'));
