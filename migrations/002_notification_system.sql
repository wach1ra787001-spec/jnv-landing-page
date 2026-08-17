-- Notification logs table to prevent duplicate notifications
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'trade_imported', -- 'trade_imported', 'email_sent', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  channel TEXT NOT NULL, -- 'in_app', 'email'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trade_id, notification_type, channel) -- Prevent duplicate notifications per trade
);

-- User notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_mt5_imports BOOLEAN DEFAULT TRUE;

-- Enable RLS on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_logs (service role can access all)
CREATE POLICY "notification_logs_service_access" ON notification_logs
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Index for efficient querying
CREATE INDEX idx_notification_logs_user_trade ON notification_logs(user_id, trade_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at DESC);
