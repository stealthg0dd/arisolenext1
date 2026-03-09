-- =============================================================================
-- ARISOLE: Final schema for Feed, Record, Profile, Daily Check-in, AI Coach
-- Run this in Supabase SQL Editor if Feed shows "Database setup required" (PGRST205)
-- =============================================================================

-- 1. Ensure posts has all columns needed by feed.ts
alter table public.posts add column if not exists duration_seconds int default 120;
alter table public.posts add column if not exists challenge_id uuid references public.challenges(id) on delete set null;

-- 2. Ensure user_profiles has all columns needed by feed + profile
alter table public.user_profiles add column if not exists referral_code text unique;
alter table public.user_profiles add column if not exists referral_count int not null default 0;
alter table public.user_profiles add column if not exists referred_by uuid references public.user_profiles(id) on delete set null;
alter table public.user_profiles add column if not exists user_interests jsonb default '[]'::jsonb;
alter table public.user_profiles add column if not exists is_premium boolean not null default false;
alter table public.user_profiles add column if not exists expo_push_token text;

-- 3. Ensure gait_score and analysis_json exist (for AI pipeline)
alter table public.posts add column if not exists gait_score numeric;
alter table public.posts add column if not exists analysis_json jsonb;

-- 4. daily_logs for Daily Check-in modal (emoji mood + energy)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  emoji_mood text not null,
  energy_level int not null check (energy_level between 1 and 10),
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table public.daily_logs enable row level security;
create policy "Users read own daily_logs" on public.daily_logs for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own daily_logs" on public.daily_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own daily_logs" on public.daily_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_daily_logs_user_date on public.daily_logs (user_id, date);

-- 5. Indexes for feed performance
create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_user_id_created_at on public.posts (user_id, created_at desc);
create index if not exists idx_posts_challenge_id on public.posts (challenge_id);
create index if not exists idx_likes_post_id on public.likes (post_id);
create index if not exists idx_comments_post_id_created_at on public.comments (post_id, created_at desc);

-- 6. Realtime for feed
do $$
begin
  begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.likes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.user_profiles; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.challenge_participants; exception when duplicate_object then null; end;
end;
$$;

-- 7. Storage: Create 'videos' bucket (for Record screen uploads)
--    Bucket must be PUBLIC so Gemini analyze-video can fetch the URL
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set public = true;

-- Policies for videos bucket
drop policy if exists "Authenticated users can upload videos" on storage.objects;
create policy "Authenticated users can upload videos"
on storage.objects for insert to authenticated with check (bucket_id = 'videos');

drop policy if exists "Public read for videos" on storage.objects;
create policy "Public read for videos"
on storage.objects for select to public using (bucket_id = 'videos');
