-- MT5 Events Table: Stores all raw events from the EA
CREATE TABLE mt5_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq bigint NOT NULL,
  event_type text NOT NULL,
  jnv_user_id text NOT NULL,
  terminal_id text NOT NULL,
  account_login bigint NOT NULL,
  sent_at timestamp with time zone NOT NULL,
  received_at timestamp with time zone DEFAULT now(),
  payload jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  
  -- Deduplication: (account_login, seq) must be unique per terminal
  UNIQUE(account_login, seq)
);

CREATE INDEX idx_mt5_events_user ON mt5_events(user_id);
CREATE INDEX idx_mt5_events_event_type ON mt5_events(event_type);
CREATE INDEX idx_mt5_events_account_login ON mt5_events(account_login);
CREATE INDEX idx_mt5_events_received_at ON mt5_events(received_at);
CREATE INDEX idx_mt5_events_terminal_id ON mt5_events(terminal_id);

-- MT5 Connections: Track which MT5 accounts are connected to which users
CREATE TABLE mt5_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_login bigint NOT NULL,
  terminal_id text NOT NULL,
  broker_name text,
  server_name text,
  account_server text,
  terminal_build integer,
  ea_version integer,
  currency text,
  api_key_hash text NOT NULL, -- Store hashed API key for verification
  last_heartbeat_at timestamp with time zone,
  last_event_at timestamp with time zone,
  is_active boolean DEFAULT true,
  connection_token text, -- User-friendly token for frontend
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, account_login, terminal_id)
);

CREATE INDEX idx_mt5_connections_user ON mt5_connections(user_id);
CREATE INDEX idx_mt5_connections_account_login ON mt5_connections(account_login);
CREATE INDEX idx_mt5_connections_terminal_id ON mt5_connections(terminal_id);

-- MT5 Sessions: Track auth tokens for EA communication
CREATE TABLE mt5_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES mt5_connections(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone
);

CREATE INDEX idx_mt5_sessions_connection ON mt5_sessions(connection_id);
CREATE INDEX idx_mt5_sessions_expires_at ON mt5_sessions(expires_at);

-- MT5 Account Snapshots: Account state history
CREATE TABLE mt5_account_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES mt5_connections(id) ON DELETE CASCADE,
  account_login bigint NOT NULL,
  balance numeric(20,2),
  equity numeric(20,2),
  profit numeric(20,2),
  margin numeric(20,2),
  margin_free numeric(20,2),
  margin_level numeric(10,2),
  trade_allowed boolean,
  captured_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_mt5_account_snapshots_connection ON mt5_account_snapshots(connection_id);
CREATE INDEX idx_mt5_account_snapshots_captured_at ON mt5_account_snapshots(captured_at);

-- Symbol Specs: Metadata about traded instruments
CREATE TABLE mt5_symbol_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  digits integer,
  point numeric(10,8),
  tick_size numeric(10,8),
  tick_value numeric(15,2),
  contract_size numeric(10,2),
  volume_min numeric(10,2),
  volume_max numeric(15,2),
  volume_step numeric(10,2),
  base_currency text,
  profit_currency text,
  spread_current integer,
  bid numeric(15,8),
  ask numeric(15,8),
  captured_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(symbol)
);

CREATE INDEX idx_mt5_symbol_specs_symbol ON mt5_symbol_specs(symbol);

-- Trade OHLC: Broker-sourced candles around trade open/close
CREATE TABLE mt5_trade_ohlc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mt5_event_id uuid REFERENCES mt5_events(id) ON DELETE CASCADE,
  ticket bigint, -- Position or deal ticket this OHLC is tagged to
  symbol text NOT NULL,
  timeframe text NOT NULL, -- M1, M5, M15, H1, etc.
  trade_time timestamp with time zone,
  candles jsonb NOT NULL, -- Array of {time, open, high, low, close, tick_volume, spread}
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_mt5_trade_ohlc_symbol ON mt5_trade_ohlc(symbol);
CREATE INDEX idx_mt5_trade_ohlc_ticket ON mt5_trade_ohlc(ticket);

-- Processed Trades: Derived from raw events, ready for journal
CREATE TABLE mt5_processed_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES mt5_connections(id),
  mt5_ticket text,
  position_id bigint,
  deal_ticket bigint,
  symbol text NOT NULL,
  direction text, -- 'buy' or 'sell'
  volume numeric(15,2),
  entry_price numeric(15,8),
  entry_time timestamp with time zone,
  exit_price numeric(15,8),
  exit_time timestamp with time zone,
  stop_loss numeric(15,8),
  take_profit numeric(15,8),
  profit numeric(15,2),
  swap numeric(10,2),
  commission numeric(10,2),
  comment text,
  status text, -- 'open', 'closed', 'partial_close'
  entry_event_id uuid REFERENCES mt5_events(id),
  exit_event_id uuid REFERENCES mt5_events(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_mt5_processed_trades_user ON mt5_processed_trades(user_id);
CREATE INDEX idx_mt5_processed_trades_status ON mt5_processed_trades(status);
CREATE INDEX idx_mt5_processed_trades_symbol ON mt5_processed_trades(symbol);
CREATE INDEX idx_mt5_processed_trades_entry_time ON mt5_processed_trades(entry_time);

-- Enable RLS
ALTER TABLE mt5_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt5_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt5_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt5_account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt5_processed_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own MT5 events"
  ON mt5_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own MT5 connections"
  ON mt5_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own MT5 processed trades"
  ON mt5_processed_trades FOR SELECT
  USING (user_id = auth.uid());
