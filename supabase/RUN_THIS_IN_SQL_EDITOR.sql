-- =============================================================================
-- ARISOLE: Run this in Supabase Dashboard > SQL Editor
-- Fixes: Feed schema error (PGRST205), Record video upload, Profile/Check-in
-- Tables: posts, user_profiles, challenges, likes, comments, daily_check_ins
-- =============================================================================

-- 1. Posts: columns for Feed + AI pipeline
alter table public.posts add column if not exists gait_score numeric;
alter table public.posts add column if not exists analysis_json jsonb;
alter table public.posts add column if not exists duration_seconds int default 120;
alter table public.posts add column if not exists challenge_id uuid references public.challenges(id) on delete set null;

-- 2. User profiles: Feed author + Profile + Premium + Onboarding
alter table public.user_profiles add column if not exists referral_code text unique;
alter table public.user_profiles add column if not exists onboarding_goal text;
alter table public.user_profiles add column if not exists onboarding_activity_level text;
alter table public.user_profiles add column if not exists onboarding_smart_insoles text;
alter table public.user_profiles add column if not exists referral_count int not null default 0;
alter table public.user_profiles add column if not exists referred_by uuid references public.user_profiles(id) on delete set null;
alter table public.user_profiles add column if not exists user_interests jsonb default '[]'::jsonb;
alter table public.user_profiles add column if not exists is_premium boolean not null default false;
alter table public.user_profiles add column if not exists expo_push_token text;

-- 3. Indexes for Feed performance
create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_challenge_id on public.posts (challenge_id);

-- 4. Realtime for Feed
do $$
begin
  begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.likes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.user_profiles; exception when duplicate_object then null; end;
end;
$$;

-- 5. Storage: Create 'videos' bucket (PUBLIC so Gemini can fetch for analysis)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload videos" on storage.objects;
create policy "Authenticated users can upload videos"
on storage.objects for insert to authenticated with check (bucket_id = 'videos');

drop policy if exists "Public read for videos" on storage.objects;
create policy "Public read for videos"
on storage.objects for select to public using (bucket_id = 'videos');
