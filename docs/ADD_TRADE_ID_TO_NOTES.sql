-- Add trade_id column to trade_notes table to link notes to specific trades
-- Run this migration in your Supabase SQL editor

-- Step 1: Add the trade_id column (nullable first to avoid errors)
ALTER TABLE public.trade_notes
ADD COLUMN trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE;

-- Step 2: Create an index on trade_id for query performance
CREATE INDEX idx_trade_notes_trade_id ON public.trade_notes(trade_id);

-- Step 3: Add a unique constraint if you want only one note per trade (optional)
-- ALTER TABLE public.trade_notes ADD CONSTRAINT unique_trade_note UNIQUE(trade_id);

-- Step 4: Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'trade_notes' AND column_name = 'trade_id';

-- If you see: trade_notes | uuid | then the migration was successful!
