create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  premarket_reminders_enabled boolean not null default true,
  premarket_email_enabled boolean not null default true,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.premarket_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_name text not null check (session_name in ('asian', 'london', 'new_york')),
  routine_date date not null,
  mindset text not null,
  market_bias text not null,
  planned_setups text not null,
  risk_limits text not null,
  trading_rules text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_name, routine_date)
);

alter table public.notification_preferences enable row level security;
alter table public.premarket_routines enable row level security;

create policy "Users manage their reminder preferences" on public.notification_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their premarket routines" on public.premarket_routines for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.premarket_routines to authenticated;
create index if not exists premarket_routines_user_date_idx on public.premarket_routines(user_id, routine_date desc); 
create index if not exists notification_preferences_enabled_idx on public.notification_preferences(premarket_reminders_enabled, premarket_email_enabled);

alter table public.notification_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
create index if not exists notification_logs_premarket_idx on public.notification_logs(notification_type, created_at desc); 

grant select, insert, update on public.notification_logs to authenticated;
comment on table public.premarket_routines is 'User pre-market preparation recorded before a trading session.';
comment on table public.notification_preferences is 'Per-user in-app and email reminder settings.';
comment on column public.notification_logs.metadata is 'Reminder session and deduplication metadata.';
