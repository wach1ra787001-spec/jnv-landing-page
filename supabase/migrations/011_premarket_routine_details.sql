alter table public.premarket_routines
  add column if not exists trading_date date,
  add column if not exists sleep_duration numeric,
  add column if not exists energy_level integer,
  add column if not exists mood text,
  add column if not exists stress_level integer,
  add column if not exists focus_level integer,
  add column if not exists meditation_completed boolean not null default false,
  add column if not exists higher_timeframe_bias text,
  add column if not exists key_levels text,
  add column if not exists planned_instruments text,
  add column if not exists max_trades_planned integer,
  add column if not exists risk_per_trade numeric,
  add column if not exists max_daily_loss numeric,
  add column if not exists max_trades_after_loss integer,
  add column if not exists setup_strategy text,
  add column if not exists entry_criteria text,
  add column if not exists stop_loss_criteria text,
  add column if not exists take_profit_criteria text,
  add column if not exists minimum_rr numeric,
  add column if not exists news_to_avoid text,
  add column if not exists rules_acknowledged boolean not null default false,
  add column if not exists mentally_ready boolean,
  add column if not exists premarket_notes text,
  add column if not exists screenshot_url text,
  add column if not exists completed_at timestamptz;

create table if not exists public.premarket_trade_links (
  routine_id uuid not null references public.premarket_routines(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (routine_id, trade_id)
);

alter table public.premarket_trade_links enable row level security;
create policy "Users manage their premarket trade links" on public.premarket_trade_links for all to authenticated
using (exists (select 1 from public.premarket_routines r where r.id = routine_id and r.user_id = (select auth.uid())))
with check (exists (select 1 from public.premarket_routines r where r.id = routine_id and r.user_id = (select auth.uid())));
grant select, insert, delete on public.premarket_trade_links to authenticated;
create index if not exists premarket_trade_links_trade_idx on public.premarket_trade_links(trade_id); 
update public.premarket_routines set trading_date = routine_date where trading_date is null;
alter table public.premarket_routines alter column trading_date set not null;
comment on table public.premarket_trade_links is 'Links a pre-market routine to one or more journaled trades.';
