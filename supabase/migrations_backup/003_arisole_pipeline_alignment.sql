-- Arisole Storage & AI Pipeline Alignment
-- Aligns posts table with gait_score + analysis_json, ensures profiles, enhances OAuth trigger.

-- 1. Add gait_score and analysis_json to posts (migration for existing schema)
alter table public.posts add column if not exists gait_score numeric;
alter table public.posts add column if not exists analysis_json jsonb;

-- 2. Migrate existing ai_analysis data (only if ai_analysis column exists)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'ai_analysis'
  ) then
    update public.posts
    set
      analysis_json = ai_analysis,
      gait_score = coalesce((ai_analysis->>'postureScore')::numeric, 0)
    where ai_analysis is not null and (analysis_json is null or gait_score is null);
  end if;
end;
$$;

-- 4. Create public.profiles view (alias for user_profiles, linked to auth.users)
create or replace view public.profiles as
select id, username, avatar, streak_days, points, level, last_check_in_date, created_at
from public.user_profiles;

-- Grant select on profiles view
grant select on public.profiles to authenticated;

-- 5. Enhance handle_new_user for Google OAuth (full_name, name from raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_username text;
begin
  -- Prefer: username > full_name > name > email prefix (Google OAuth provides full_name)
  v_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
  -- Ensure non-empty; fallback to id prefix if empty
  if v_username is null or trim(v_username) = '' then
    v_username := 'user_' || left(new.id::text, 8);
  end if;

  insert into public.user_profiles (id, username)
  values (new.id, v_username)
  on conflict (id) do nothing;

  return new;
end;
$$;
