-- Link posts to challenges for "Join" flow and challenge badges
alter table public.posts add column if not exists challenge_id uuid references public.challenges(id) on delete set null;

create index if not exists idx_posts_challenge_id on public.posts (challenge_id);
