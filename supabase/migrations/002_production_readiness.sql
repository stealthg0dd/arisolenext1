-- Production readiness: indexes, realtime publication, challenge score refresh, scheduler

create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_user_id_created_at on public.posts (user_id, created_at desc);
create index if not exists idx_likes_post_id on public.likes (post_id);
create index if not exists idx_comments_post_id_created_at on public.comments (post_id, created_at desc);
create index if not exists idx_daily_check_ins_user_date on public.daily_check_ins (user_id, date);
create index if not exists idx_challenge_participants_challenge_score
  on public.challenge_participants (challenge_id, score desc, created_at asc);

do $$
begin
  begin
    alter publication supabase_realtime add table public.posts;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.likes;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.comments;
  exception
    when duplicate_object then null;
  end;
end;
$$;

create or replace function public.refresh_challenge_scores(p_challenge_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int := 0;
begin
  with target_challenges as (
    select c.id, c.type, c.start_date, c.end_date
    from public.challenges c
    where (p_challenge_id is null and current_date between c.start_date and c.end_date)
       or c.id = p_challenge_id
  ),
  participant_pool as (
    select tc.id as challenge_id, d.user_id
    from target_challenges tc
    join public.daily_check_ins d
      on d.date between tc.start_date and tc.end_date
    union
    select tc.id as challenge_id, p.user_id
    from target_challenges tc
    join public.posts p
      on p.created_at::date between tc.start_date and tc.end_date
  ),
  scored as (
    select
      pool.challenge_id,
      pool.user_id,
      case c.type
        when 'distance' then (
          select coalesce(sum(case when d.activity = 'run' then 3 else 1 end), 0)::numeric
          from public.daily_check_ins d
          where d.user_id = pool.user_id
            and d.date between c.start_date and c.end_date
        )
        when 'streak' then (
          select coalesce(max(streak_len), 0)::numeric
          from (
            select count(*) as streak_len
            from (
              select x.date, x.date - row_number() over (order by x.date)::int as grp
              from (
                select distinct d2.date
                from public.daily_check_ins d2
                where d2.user_id = pool.user_id
                  and d2.date between c.start_date and c.end_date
              ) x
            ) seq
            group by seq.grp
          ) streaks
        )
        when 'consistency' then (
          select count(distinct d.date)::numeric
          from public.daily_check_ins d
          where d.user_id = pool.user_id
            and d.date between c.start_date and c.end_date
        )
        else 0::numeric
      end as score
    from participant_pool pool
    join public.challenges c on c.id = pool.challenge_id
  ),
  upserted as (
    insert into public.challenge_participants (challenge_id, user_id, score)
    select challenge_id, user_id, score
    from scored
    on conflict (challenge_id, user_id)
    do update set
      score = excluded.score
    returning 1
  )
  select count(*) into v_rows from upserted;

  with target_challenges as (
    select c.id
    from public.challenges c
    where (p_challenge_id is null and current_date between c.start_date and c.end_date)
       or c.id = p_challenge_id
  ),
  ranked as (
    select
      cp.id,
      dense_rank() over (
        partition by cp.challenge_id
        order by cp.score desc, cp.created_at asc, cp.user_id asc
      ) as new_rank
    from public.challenge_participants cp
    where cp.challenge_id in (select id from target_challenges)
  )
  update public.challenge_participants cp
  set rank = ranked.new_rank
  from ranked
  where cp.id = ranked.id;

  return v_rows;
end;
$$;

revoke all on function public.refresh_challenge_scores(uuid) from public;
grant execute on function public.refresh_challenge_scores(uuid) to service_role;

do $$
declare
  v_job_id bigint;
begin
  if exists (
    select 1
    from pg_available_extensions
    where name = 'pg_cron'
  ) then
    create extension if not exists pg_cron;

    for v_job_id in
      select jobid
      from cron.job
      where jobname = 'refresh-challenge-scores-hourly'
    loop
      perform cron.unschedule(v_job_id);
    end loop;

    perform cron.schedule(
      'refresh-challenge-scores-hourly',
      '15 * * * *',
      $$select public.refresh_challenge_scores(null);$$
    );
  end if;
exception
  when others then
    raise notice 'pg_cron schedule skipped: %', sqlerrm;
end;
$$;
