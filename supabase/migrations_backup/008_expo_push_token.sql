-- Add expo_push_token to user_profiles for push notifications
alter table public.user_profiles add column if not exists expo_push_token text;

-- Enable full row in Realtime so UPDATE payload includes old values (for is_premium flip detection)
alter table public.user_profiles replica identity full;

-- Add user_profiles to Realtime for is_premium subscription
do $$
begin
  begin
    alter publication supabase_realtime add table public.user_profiles;
  exception
    when duplicate_object then null;
  end;
end;
$$;

-- Enable full row for challenge_participants so push-webhook gets old rank on UPDATE
alter table public.challenge_participants replica identity full;
