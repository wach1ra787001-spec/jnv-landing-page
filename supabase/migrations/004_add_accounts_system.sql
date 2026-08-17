-- Create accounts table for managing user trading accounts
CREATE TABLE accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name        TEXT NOT NULL,
  account_type        TEXT NOT NULL, -- 'manual', 'mt4', 'ctrader'
  broker_connection_id UUID REFERENCES broker_connections(id) ON DELETE SET NULL,
  currency            TEXT DEFAULT 'USD',
  initial_balance     NUMERIC,
  notes               TEXT,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_account_per_user 
    UNIQUE (user_id, account_name)
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own accounts
CREATE POLICY "users manage own accounts"
  ON accounts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_accounts_user_active 
  ON accounts(user_id, is_active);

CREATE INDEX idx_accounts_user_created 
  ON accounts(user_id, created_at DESC);

-- Add account_id column to trades table
ALTER TABLE trades 
ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Create index for trade filtering by account
CREATE INDEX idx_trades_account_user 
  ON trades(user_id, account_id);

-- Add default_account_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN default_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Create index for default account lookup
CREATE INDEX idx_profiles_default_account 
  ON profiles(id, default_account_id);
