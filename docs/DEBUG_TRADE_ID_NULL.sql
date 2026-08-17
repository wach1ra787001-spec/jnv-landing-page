-- Debug SQL: Check trade_notes table structure and verify trade_id is being saved correctly

-- Step 1: Check the column definition for trade_id
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trade_notes'
ORDER BY ordinal_position;

-- Step 2: View all constraints on trade_notes table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'trade_notes';

-- Step 3: Check foreign key constraints
SELECT constraint_name, table_name, column_name, referenced_table_name, referenced_column_name
FROM information_schema.referential_constraints
WHERE table_name = 'trade_notes';

-- Step 4: Check the actual data - view all notes with NULL trade_id
SELECT id, user_id, trade_id, note, created_at
FROM public.trade_notes
WHERE trade_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: View recent notes (last 10) with all columns
SELECT id, user_id, trade_id, note, created_at
FROM public.trade_notes
ORDER BY created_at DESC
LIMIT 10;

-- Step 6: If trade_id column is nullable and has no default, add NOT NULL constraint
-- ONLY run this if you've confirmed the column definition in steps 1-2
-- ALTER TABLE public.trade_notes
-- ALTER COLUMN trade_id SET NOT NULL;
