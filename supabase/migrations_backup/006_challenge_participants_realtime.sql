-- Add challenge_participants to Supabase Realtime for live leaderboard updates
do $$
begin
  begin
    alter publication supabase_realtime add table public.challenge_participants;
  exception
    when duplicate_object then null;
  end;
end;
$$;
