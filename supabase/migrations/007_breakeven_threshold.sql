ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'breakeven';

UPDATE trades
SET status = 'breakeven'
WHERE pnl_percent IS NOT NULL
  AND abs(pnl_percent) <= 0.1
  AND status <> 'breakeven';

CREATE OR REPLACE FUNCTION classify_trade_breakeven()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pnl_percent IS NOT NULL AND abs(NEW.pnl_percent) <= 0.1 THEN
    NEW.status := 'breakeven';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trades_classify_breakeven ON trades;
CREATE TRIGGER trades_classify_breakeven
BEFORE INSERT OR UPDATE OF pnl_percent, status ON trades
FOR EACH ROW EXECUTE FUNCTION classify_trade_breakeven();
