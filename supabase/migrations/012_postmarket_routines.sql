create table if not exists public.postmarket_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trading_date date not null,
  session_traded text not null,
  overall_mood text,
  energy_level integer,
  stress_level integer,
  number_of_trades integer,
  total_pnl numeric,
  total_r numeric,
  win_loss_result text,
  max_drawdown numeric,
  biggest_winning_trade numeric,
  biggest_losing_trade numeric,
  planned_vs_taken text,
  outside_plan text,
  rule_violations text,
  over_risking boolean,
  revenge_trading boolean,
  overtrading boolean,
  early_entry boolean,
  early_exit boolean,
  moved_sl boolean,
  moved_tp boolean,
  missed_valid_setups text,
  emotional_decisions text,
  best_decision text,
  biggest_mistake text,
  what_worked text,
  what_did_not_work text,
  lesson_learned text,
  improve_tomorrow text,
  screenshot_url text,
  session_rating integer,
  followed_plan boolean,
  protected_capital boolean,
  session_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.postmarket_trade_links (
  routine_id uuid not null references public.postmarket_routines(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (routine_id, trade_id)
);

alter table public.postmarket_routines enable row level security;
alter table public.postmarket_trade_links enable row level security;
create policy "Users manage their postmarket routines" on public.postmarket_routines for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their postmarket trade links" on public.postmarket_trade_links for all to authenticated using (exists (select 1 from public.postmarket_routines r where r.id = routine_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.postmarket_routines r where r.id = routine_id and r.user_id = (select auth.uid())));
grant select, insert, update, delete on public.postmarket_routines, public.postmarket_trade_links to authenticated;
create index if not exists postmarket_routines_user_date_idx on public.postmarket_routines(user_id, trading_date desc);
create index if not exists postmarket_trade_links_trade_idx on public.postmarket_trade_links(trade_id); 
