-- =============================================================================
-- ARISOLE: fix_all_tables.sql
-- Run in Supabase Dashboard > SQL Editor
-- Creates all tables, RLS, Realtime, Storage. Idempotent (safe to run multiple times).
-- =============================================================================

-- Extensions
create extension if not exists pgcrypto;

-- 1. user_profiles
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar text,
  streak_days int not null default 0,
  points int not null default 0,
  level int not null default 1,
  last_check_in_date date,
  created_at timestamptz not null default now(),
  referral_code text unique,
  referral_count int not null default 0,
  referred_by uuid references public.user_profiles(id) on delete set null,
  user_interests jsonb default '[]'::jsonb,
  is_premium boolean not null default false,
  expo_push_token text,
  onboarding_goal text,
  onboarding_activity_level text,
  onboarding_smart_insoles text
);

-- Add columns if table exists from older schema
alter table public.user_profiles add column if not exists referral_code text unique;
alter table public.user_profiles add column if not exists referral_count int not null default 0;
alter table public.user_profiles add column if not exists referred_by uuid references public.user_profiles(id) on delete set null;
alter table public.user_profiles add column if not exists user_interests jsonb default '[]'::jsonb;
alter table public.user_profiles add column if not exists is_premium boolean not null default false;
alter table public.user_profiles add column if not exists expo_push_token text;
alter table public.user_profiles add column if not exists onboarding_goal text;
alter table public.user_profiles add column if not exists onboarding_activity_level text;
alter table public.user_profiles add column if not exists onboarding_smart_insoles text;

-- 2. challenges (before posts for FK)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('distance', 'streak', 'consistency')),
  start_date date not null,
  end_date date not null,
  prize text not null,
  created_at timestamptz not null default now()
);

-- 3. posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  video_url text not null,
  caption text,
  gait_score numeric,
  analysis_json jsonb,
  likes_count int not null default 0,
  created_at timestamptz not null default now(),
  duration_seconds int default 120,
  challenge_id uuid references public.challenges(id) on delete set null
);

alter table public.posts add column if not exists gait_score numeric;
alter table public.posts add column if not exists analysis_json jsonb;
alter table public.posts add column if not exists duration_seconds int default 120;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='challenge_id') then
    alter table public.posts add column challenge_id uuid references public.challenges(id) on delete set null;
  end if;
end $$;

-- 4. daily_check_ins ("date" quoted - reserved word in PostgreSQL)
create table if not exists public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  "date" date not null,
  feeling_score int not null check (feeling_score between 1 and 10),
  shoe_type text not null,
  activity text not null check (activity in ('walk', 'run')),
  created_at timestamptz not null default now(),
  unique(user_id, "date")
);

-- 5. challenge_participants
create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  score numeric not null default 0,
  rank int,
  created_at timestamptz not null default now(),
  unique(challenge_id, user_id)
);

-- 6. likes
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, post_id)
);

-- 7. comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

-- 8. daily_logs ("date" quoted - reserved word in PostgreSQL)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  "date" date not null,
  emoji_mood text not null,
  energy_level int not null check (energy_level between 1 and 10),
  created_at timestamptz not null default now(),
  unique(user_id, "date")
);

-- Triggers
create or replace function public.sync_post_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  end if;
  if tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count_insert on public.likes;
create trigger likes_count_insert after insert on public.likes for each row execute function public.sync_post_likes_count();
drop trigger if exists likes_count_delete on public.likes;
create trigger likes_count_delete after delete on public.likes for each row execute function public.sync_post_likes_count();

-- handle_new_user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_username text;
begin
  v_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
  if v_username is null or trim(v_username) = '' then
    v_username := 'user_' || left(new.id::text, 8);
  end if;
  insert into public.user_profiles (id, username)
  values (new.id, v_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- update_daily_streak
create or replace function public.update_daily_streak(p_user_id uuid)
returns void language plpgsql security definer as $$
declare v_today date := current_date; v_last date; v_current_streak int;
begin
  select last_check_in_date, streak_days into v_last, v_current_streak
  from public.user_profiles where id = p_user_id for update;
  if v_last is null then
    update public.user_profiles set streak_days = 1, points = points + 20,
      level = greatest(1, floor((points + 20) / 100) + 1), last_check_in_date = v_today where id = p_user_id;
    return;
  end if;
  if v_last = v_today then return; end if;
  if v_last = (v_today - interval '1 day')::date then
    update public.user_profiles set streak_days = streak_days + 1, points = points + 20,
      level = greatest(1, floor((points + 20) / 100) + 1), last_check_in_date = v_today where id = p_user_id;
  else
    update public.user_profiles set streak_days = 1, points = points + 20,
      level = greatest(1, floor((points + 20) / 100) + 1), last_check_in_date = v_today where id = p_user_id;
  end if;
end;
$$;

grant execute on function public.update_daily_streak(uuid) to authenticated;

-- RLS
alter table public.user_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.daily_logs enable row level security;

-- Policies (drop and recreate for idempotency)
drop policy if exists "Profiles are readable by authenticated users" on public.user_profiles;
create policy "Profiles are readable by authenticated users" on public.user_profiles for select to authenticated using (true);
drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile" on public.user_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile" on public.user_profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Posts readable by authenticated users" on public.posts;
create policy "Posts readable by authenticated users" on public.posts for select to authenticated using (true);
drop policy if exists "Users create own posts" on public.posts;
create policy "Users create own posts" on public.posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own posts" on public.posts;
create policy "Users update own posts" on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts" on public.posts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users read own check-ins" on public.daily_check_ins;
create policy "Users read own check-ins" on public.daily_check_ins for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users upsert own check-ins" on public.daily_check_ins;
create policy "Users upsert own check-ins" on public.daily_check_ins for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own check-ins" on public.daily_check_ins;
create policy "Users update own check-ins" on public.daily_check_ins for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Challenges are readable by authenticated users" on public.challenges;
create policy "Challenges are readable by authenticated users" on public.challenges for select to authenticated using (true);

drop policy if exists "Challenge leaderboard readable" on public.challenge_participants;
create policy "Challenge leaderboard readable" on public.challenge_participants for select to authenticated using (true);
drop policy if exists "Users join/update own participation" on public.challenge_participants;
create policy "Users join/update own participation" on public.challenge_participants for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own challenge rows" on public.challenge_participants;
create policy "Users update own challenge rows" on public.challenge_participants for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Likes readable" on public.likes;
create policy "Likes readable" on public.likes for select to authenticated using (true);
drop policy if exists "Users like as themselves" on public.likes;
create policy "Users like as themselves" on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users unlike as themselves" on public.likes;
create policy "Users unlike as themselves" on public.likes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Comments readable" on public.comments;
create policy "Comments readable" on public.comments for select to authenticated using (true);
drop policy if exists "Users comment as themselves" on public.comments;
create policy "Users comment as themselves" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users delete own comments" on public.comments;
create policy "Users delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users read own daily_logs" on public.daily_logs;
create policy "Users read own daily_logs" on public.daily_logs for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users upsert own daily_logs" on public.daily_logs;
create policy "Users upsert own daily_logs" on public.daily_logs for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own daily_logs" on public.daily_logs;
create policy "Users update own daily_logs" on public.daily_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes
-- Indexes
-- First, drop the index if it was partially created incorrectly
drop index if exists public.idx_daily_check_ins_user_date;

create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_user_id_created_at on public.posts (user_id, created_at desc);
create index if not exists idx_posts_challenge_id on public.posts (challenge_id);
create index if not exists idx_likes_post_id on public.likes (post_id);
create index if not exists idx_comments_post_id_created_at on public.comments (post_id, created_at desc);

-- Explicitly quoting "date" here is critical
create index if not exists idx_daily_check_ins_user_date on public.daily_check_ins (user_id, "date");

create index if not exists idx_challenge_participants_challenge_score on public.challenge_participants (challenge_id, score desc, created_at asc);
-- Realtime
do $$
begin
  begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.likes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.user_profiles; exception when duplicate_object then null; end;
end;
$$;

-- Storage: videos bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gait-videos', 'gait-videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload videos" on storage.objects;
create policy "Authenticated users can upload videos" on storage.objects for insert to authenticated with check (bucket_id in ('videos', 'gait-videos'));

drop policy if exists "Public read for videos" on storage.objects;
create policy "Public read for videos" on storage.objects for select to public using (bucket_id in ('videos', 'gait-videos'));
