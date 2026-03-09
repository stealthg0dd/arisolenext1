-- Enable required extensions
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
  created_at timestamptz not null default now()
);

-- 2. posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  video_url text not null,
  caption text,
  ai_analysis jsonb,
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);

-- 3. daily_check_ins
create table if not exists public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  date date not null,
  feeling_score int not null check (feeling_score between 1 and 10),
  shoe_type text not null,
  activity text not null check (activity in ('walk', 'run')),
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- 4. challenges
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('distance', 'streak', 'consistency')),
  start_date date not null,
  end_date date not null,
  prize text not null,
  created_at timestamptz not null default now()
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

-- Trigger to maintain likes_count efficiently.
create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer
as $$
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
create trigger likes_count_insert
after insert on public.likes
for each row execute function public.sync_post_likes_count();

drop trigger if exists likes_count_delete on public.likes;
create trigger likes_count_delete
after delete on public.likes
for each row execute function public.sync_post_likes_count();

-- Create profile row automatically on first sign up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Daily streak updater invoked by client after daily check-in.
create or replace function public.update_daily_streak(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_today date := current_date;
  v_last date;
  v_current_streak int;
begin
  select last_check_in_date, streak_days
  into v_last, v_current_streak
  from public.user_profiles
  where id = p_user_id
  for update;

  if v_last is null then
    update public.user_profiles
      set streak_days = 1,
          points = points + 20,
          level = greatest(1, floor((points + 20) / 100) + 1),
          last_check_in_date = v_today
    where id = p_user_id;
    return;
  end if;

  if v_last = v_today then
    return;
  elsif v_last = (v_today - interval '1 day')::date then
    update public.user_profiles
      set streak_days = streak_days + 1,
          points = points + 20,
          level = greatest(1, floor((points + 20) / 100) + 1),
          last_check_in_date = v_today
    where id = p_user_id;
  else
    update public.user_profiles
      set streak_days = 1,
          points = points + 20,
          level = greatest(1, floor((points + 20) / 100) + 1),
          last_check_in_date = v_today
    where id = p_user_id;
  end if;
end;
$$;

-- RLS
alter table public.user_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- user_profiles policies
create policy "Profiles are readable by authenticated users"
on public.user_profiles for select
to authenticated using (true);

create policy "Users can update own profile"
on public.user_profiles for update
to authenticated using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can insert own profile"
on public.user_profiles for insert
to authenticated with check (auth.uid() = id);

-- posts policies
create policy "Posts readable by authenticated users"
on public.posts for select
to authenticated using (true);

create policy "Users create own posts"
on public.posts for insert
to authenticated with check (auth.uid() = user_id);

create policy "Users update own posts"
on public.posts for update
to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete own posts"
on public.posts for delete
to authenticated using (auth.uid() = user_id);

-- daily check-ins policies
create policy "Users read own check-ins"
on public.daily_check_ins for select
to authenticated using (auth.uid() = user_id);

create policy "Users upsert own check-ins"
on public.daily_check_ins for insert
to authenticated with check (auth.uid() = user_id);

create policy "Users update own check-ins"
on public.daily_check_ins for update
to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- challenges policies
create policy "Challenges are readable by authenticated users"
on public.challenges for select
to authenticated using (true);

-- challenge participants policies
create policy "Challenge leaderboard readable"
on public.challenge_participants for select
to authenticated using (true);

create policy "Users join/update own participation"
on public.challenge_participants for insert
to authenticated with check (auth.uid() = user_id);

create policy "Users update own challenge rows"
on public.challenge_participants for update
to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- likes policies
create policy "Likes readable"
on public.likes for select
to authenticated using (true);

create policy "Users like as themselves"
on public.likes for insert
to authenticated with check (auth.uid() = user_id);

create policy "Users unlike as themselves"
on public.likes for delete
to authenticated using (auth.uid() = user_id);

-- comments policies
create policy "Comments readable"
on public.comments for select
to authenticated using (true);

create policy "Users comment as themselves"
on public.comments for insert
to authenticated with check (auth.uid() = user_id);

create policy "Users delete own comments"
on public.comments for delete
to authenticated using (auth.uid() = user_id);

grant execute on function public.update_daily_streak(uuid) to authenticated;
