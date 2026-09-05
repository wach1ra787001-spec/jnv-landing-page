create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_events_user_created_idx
  on public.security_events (user_id, created_at desc);

alter table public.security_events enable row level security;

drop policy if exists "Users can read their own security events" on public.security_events;
create policy "Users can read their own security events"
  on public.security_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own security events" on public.security_events;
create policy "Users can insert their own security events"
  on public.security_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.security_events to authenticated;
