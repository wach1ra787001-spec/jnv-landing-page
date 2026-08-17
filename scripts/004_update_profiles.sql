-- Update profiles table to remove sensitive subscription fields
-- Keep only user-editable fields

-- Remove subscription columns from profiles (they're now in subscriptions table)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- Profiles should only contain user-editable data
-- Existing columns:
-- - id (PK, from auth.users)
-- - email
-- - full_name
-- - avatar_url
-- - timezone
-- - mt5_connected
-- - preferences (JSONB for user settings)
-- - created_at
-- - updated_at
