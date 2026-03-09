-- Add referral and premium columns to user_profiles
alter table public.user_profiles add column if not exists referral_code text unique;
alter table public.user_profiles add column if not exists referral_count int not null default 0;
alter table public.user_profiles add column if not exists referred_by uuid references public.user_profiles(id) on delete set null;
alter table public.user_profiles add column if not exists user_interests jsonb default '[]'::jsonb;
alter table public.user_profiles add column if not exists is_premium boolean not null default false;

-- Create index for referral code lookups
create unique index if not exists idx_user_profiles_referral_code on public.user_profiles(referral_code) where referral_code is not null;

-- Function to generate and assign referral code for users who don't have one
create or replace function public.ensure_referral_code(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_exists boolean;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- exclude ambiguous 0,O,1,I
  v_i int;
begin
  select referral_code into v_code from user_profiles where id = p_user_id;
  if v_code is not null then
    return v_code;
  end if;

  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    select exists(select 1 from user_profiles where referral_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;

  update user_profiles set referral_code = v_code where id = p_user_id;
  return v_code;
end;
$$;

-- Function to apply referral: add reward point to referrer when new user uses code
create or replace function public.apply_referral_code(p_new_user_id uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
begin
  if p_code is null or trim(p_code) = '' then
    return false;
  end if;

  select id into v_referrer_id from user_profiles where referral_code = upper(trim(p_code)) and id != p_new_user_id;
  if v_referrer_id is null then
    return false;
  end if;

  update user_profiles set points = points + 1, referral_count = referral_count + 1 where id = v_referrer_id;
  update user_profiles set referred_by = v_referrer_id where id = p_new_user_id;
  return true;
end;
$$;

grant execute on function public.ensure_referral_code(uuid) to authenticated;
grant execute on function public.apply_referral_code(uuid, text) to authenticated;
