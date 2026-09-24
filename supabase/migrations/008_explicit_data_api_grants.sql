-- Supabase no longer auto-grants Data API access to newly created public tables.
-- Keep grants explicit for tables created by older migrations and deployment branches.
DO $$
DECLARE
  table_name text;
  table_names text[] := ARRAY[
    'profiles',
    'trades',
    'csv_imports',
    'accounts',
    'broker_connections',
    'missed_trades',
    'user_settings',
    'journal_trades',
    'playbooks',
    'playbook_rules',
    'personal_notes',
    'trading_goals',
    'trade_tags',
    'trade_attachments',
    'session_performance',
    'holding_time_buckets',
    'news_time_impact',
    'holding_time_trades',
    'news_times_config',
    'holding_time_trends',
    'news_pnl_timeline',
    'roles',
    'user_roles',
    'user_suspension'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', table_name);
    END IF;
  END LOOP;
END $$;

-- Do not grant anon access: these tables contain user-owned trading and profile data.
-- RLS remains the authorization boundary for authenticated requests.
