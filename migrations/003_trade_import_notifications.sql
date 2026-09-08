CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email')),
  status TEXT NOT NULL DEFAULT 'sent',
  title TEXT,
  message TEXT,
  href TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_logs_user_select" ON public.notification_logs;
CREATE POLICY "notification_logs_user_select" ON public.notification_logs
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "notification_logs_user_insert" ON public.notification_logs;
CREATE POLICY "notification_logs_user_insert" ON public.notification_logs
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "notification_logs_user_update" ON public.notification_logs;
CREATE POLICY "notification_logs_user_update" ON public.notification_logs
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_channel_created
  ON public.notification_logs(user_id, channel, created_at DESC);
