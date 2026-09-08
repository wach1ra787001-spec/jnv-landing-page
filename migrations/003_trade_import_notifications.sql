ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS href TEXT;

DROP POLICY IF EXISTS "notification_logs_service_access" ON notification_logs;
CREATE POLICY "notification_logs_user_select" ON notification_logs
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "notification_logs_user_update" ON notification_logs
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_channel_created
  ON notification_logs(user_id, channel, created_at DESC);
