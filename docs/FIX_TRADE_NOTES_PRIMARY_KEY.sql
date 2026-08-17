-- Fix for trade_notes table - allow multiple notes per trade
-- The current primary key constraint on 'id' is preventing multiple notes

-- This SQL needs to be run in your Supabase SQL Editor:

-- Step 1: Check current constraint
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'trade_notes' AND constraint_type = 'PRIMARY KEY';

-- Step 2: The 'id' column should have a DEFAULT generated as identity
-- If it doesn't, the table will reject duplicate inserts
-- Make sure id is properly configured as PRIMARY KEY with auto-generation

-- Verify the table structure is correct:
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'trade_notes'
ORDER BY ordinal_position;

-- The issue is that 'id' needs to auto-generate UUID for each new note
-- If the column_default shows NULL for 'id', you need to add the default:

ALTER TABLE public.trade_notes 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Then verify the constraint is set correctly:
ALTER TABLE public.trade_notes 
ADD PRIMARY KEY (id);

-- After running these commands, new notes should insert correctly
