-- Create broker_connections table for storing OAuth tokens and sync state

CREATE TABLE broker_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker              TEXT NOT NULL,
  
  -- OAuth tokens (encrypted recommended)
  access_token        TEXT,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  
  -- cTrader account info
  ctrader_account_id  BIGINT,
  account_login       TEXT,
  account_name        TEXT,
  broker_name         TEXT,
  is_live             BOOLEAN DEFAULT false,
  
  -- Connection and sync state
  is_connected        BOOLEAN DEFAULT false,
  last_synced_at      TIMESTAMPTZ,
  last_sync_error     TEXT,
  sync_from_date      DATE,
  
  -- Metadata
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_broker_per_user 
    UNIQUE (user_id, broker, ctrader_account_id)
);

-- Enable RLS
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own connections
CREATE POLICY "users manage own connections"
  ON broker_connections
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_broker_connections_user_broker 
  ON broker_connections(user_id, broker);

CREATE INDEX idx_broker_connections_is_connected 
  ON broker_connections(user_id, is_connected);
