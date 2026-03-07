-- Arisole seed data
-- This script uses existing auth users and safely no-ops when none exist.

with base_users as (
  select
    u.id,
    coalesce(nullif(u.raw_user_meta_data ->> 'username', ''), split_part(u.email, '@', 1), 'runner') as username,
    row_number() over (order by u.created_at asc) as rn
  from auth.users u
  order by u.created_at asc
  limit 8
)
insert into public.user_profiles (id, username, avatar, streak_days, points, level, last_check_in_date)
select
  bu.id,
  case when bu.rn = 1 then bu.username else bu.username || '_' || bu.rn::text end,
  null,
  0,
  0,
  1,
  null
from base_users bu
on conflict (id) do update
set username = excluded.username;

insert into public.challenges (name, type, start_date, end_date, prize)
values
  ('7-Day Consistency Cup', 'consistency', current_date - 3, current_date + 3, 'Arisole T-Shirt'),
  ('Weekend Run Surge', 'distance', current_date - 1, current_date + 5, 'Smart Running Socks'),
  ('Streak Sprint', 'streak', current_date - 4, current_date + 2, 'Premium Badge Pack')
on conflict do nothing;

with base_users as (
  select
    id,
    row_number() over (order by created_at asc) as rn
  from auth.users
  order by created_at asc
  limit 8
),
days as (
  select generate_series(0, 9) as offset_day
)
insert into public.daily_check_ins (user_id, date, feeling_score, shoe_type, activity)
select
  bu.id,
  current_date - d.offset_day,
  (6 + ((bu.rn + d.offset_day) % 5))::int,
  (array['Road', 'Trail', 'Cushion'])[1 + ((bu.rn + d.offset_day) % 3)],
  case when (bu.rn + d.offset_day) % 3 = 0 then 'run' else 'walk' end
from base_users bu
cross join days d
where (bu.rn + d.offset_day) % 2 = 0
on conflict (user_id, date) do update
set
  feeling_score = excluded.feeling_score,
  shoe_type = excluded.shoe_type,
  activity = excluded.activity;

with base_users as (
  select
    id,
    row_number() over (order by created_at asc) as rn
  from auth.users
  order by created_at asc
  limit 8
),
slots as (
  select generate_series(1, 2) as slot
)
insert into public.posts (user_id, video_url, caption, ai_analysis, created_at)
select
  bu.id,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  case when s.slot = 1 then 'Morning walk check-in' else 'Evening run progress' end,
  jsonb_build_object(
    'postureScore', 68 + ((bu.rn + s.slot) % 25),
    'insights', jsonb_build_array('Relax shoulders', 'Keep cadence steady', 'Drive arms softly'),
    'message', 'Great effort today. Stay smooth and consistent.'
  ),
  now() - ((bu.rn * s.slot) || ' hours')::interval
from base_users bu
cross join slots s
where not exists (
  select 1
  from public.posts p
  where p.user_id = bu.id
    and p.caption = case when s.slot = 1 then 'Morning walk check-in' else 'Evening run progress' end
);

with sample_posts as (
  select p.id, p.user_id,
         row_number() over (order by p.created_at desc) as post_rn
  from public.posts p
  order by p.created_at desc
  limit 20
),
base_users as (
  select id, row_number() over (order by created_at asc) as user_rn
  from auth.users
  order by created_at asc
  limit 8
)
insert into public.likes (user_id, post_id)
select bu.id, sp.id
from sample_posts sp
join base_users bu
  on bu.id <> sp.user_id
where ((sp.post_rn + bu.user_rn) % 3 = 0)
on conflict (user_id, post_id) do nothing;

with sample_posts as (
  select p.id,
         row_number() over (order by p.created_at desc) as post_rn
  from public.posts p
  order by p.created_at desc
  limit 12
),
base_users as (
  select id, row_number() over (order by created_at asc) as user_rn
  from auth.users
  order by created_at asc
  limit 8
)
insert into public.comments (user_id, post_id, content)
select
  bu.id,
  sp.id,
  (array[
    'Strong rhythm today!',
    'Nice consistency. Keep it going.',
    'Great form and pacing.',
    'Love the daily commitment.'
  ])[1 + ((sp.post_rn + bu.user_rn) % 4)]
from sample_posts sp
join base_users bu on ((sp.post_rn + bu.user_rn) % 4 = 0)
where not exists (
  select 1
  from public.comments c
  where c.user_id = bu.id
    and c.post_id = sp.id
);

select public.refresh_challenge_scores(null);
