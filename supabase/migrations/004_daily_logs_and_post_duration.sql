-- daily_logs: Emoji Mood + Energy Level (for Daily Check-in modal)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  emoji_mood text not null,
  energy_level int not null check (energy_level between 1 and 10),
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

comment on table public.daily_logs is 'Daily check-in modal: emoji mood + energy level';

alter table public.daily_logs enable row level security;

create policy "Users read own daily_logs"
on public.daily_logs for select
to authenticated using (auth.uid() = user_id);

create policy "Users insert own daily_logs"
on public.daily_logs for insert
to authenticated with check (auth.uid() = user_id);

create policy "Users update own daily_logs"
on public.daily_logs for update
to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_daily_logs_user_date on public.daily_logs (user_id, date);

-- duration_seconds on posts for Total Movement Minutes
alter table public.posts add column if not exists duration_seconds int default 120;
