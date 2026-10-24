-- Collexus account profiles. Roles and campus IDs are user supplied profile
-- labels; they must never be used as proof of enrollment or authorization.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  account_type text check (account_type is null or account_type in ('student', 'faculty', 'guest')),
  campus_id text,
  profile_domain text,
  profile_skills text[] not null default '{}'::text[],
  profile_technologies text[] not null default '{}'::text[],
  profile_interests text[] not null default '{}'::text[],
  profile_about text,
  profile_complete boolean not null default false,
  profile_branch_category text,
  profile_branch_details text,
  profile_experience text,
  profile_culture text[] not null default '{}'::text[],
  profile_favorite_foods text[] not null default '{}'::text[],
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.profiles
  add column if not exists profile_technologies text[] not null default '{}'::text[];

comment on table public.profiles is
  'Private Collexus profile data. Account type and campus ID are self-reported and are not authorization claims.';

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on table public.profiles from public, anon;
grant select on table public.profiles to authenticated;
grant update (
  full_name,
  account_type,
  campus_id,
  profile_domain,
  profile_skills,
  profile_technologies,
  profile_interests,
  profile_about,
  profile_complete,
  profile_branch_category,
  profile_branch_details,
  profile_experience,
  profile_culture,
  profile_favorite_foods
) on table public.profiles to authenticated;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_profile_updated_at() from public, anon, authenticated;
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  selected_account_type text := metadata ->> 'account_type';
begin
  insert into public.profiles (id, full_name, account_type, campus_id)
  values (
    new.id,
    nullif(pg_catalog.btrim(coalesce(metadata ->> 'full_name', metadata ->> 'name')), ''),
    case when selected_account_type in ('student', 'faculty', 'guest') then selected_account_type else null end,
    nullif(pg_catalog.btrim(metadata ->> 'campus_id'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
drop trigger if exists create_collexus_profile_after_signup on auth.users;
create trigger create_collexus_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

-- Move profile data saved by the previous client-only implementation into the
-- private table while preserving existing auth accounts.
insert into public.profiles (
  id,
  full_name,
  account_type,
  campus_id,
  profile_domain,
  profile_skills,
  profile_technologies,
  profile_interests,
  profile_about,
  profile_complete,
  profile_branch_category,
  profile_branch_details,
  profile_experience,
  profile_culture,
  profile_favorite_foods
)
select
  users.id,
  nullif(pg_catalog.btrim(coalesce(metadata ->> 'full_name', metadata ->> 'name')), ''),
  case when metadata ->> 'account_type' in ('student', 'faculty', 'guest') then metadata ->> 'account_type' else null end,
  nullif(pg_catalog.btrim(metadata ->> 'campus_id'), ''),
  nullif(pg_catalog.btrim(metadata ->> 'profile_domain'), ''),
  case when pg_catalog.jsonb_typeof(metadata -> 'profile_skills') = 'array' then array(
    select value #>> '{}'
    from pg_catalog.jsonb_array_elements(metadata -> 'profile_skills') as entries(value)
    where pg_catalog.jsonb_typeof(value) = 'string'
  ) else '{}'::text[] end,
  case when pg_catalog.jsonb_typeof(metadata -> 'profile_technologies') = 'array' then array(
    select value #>> '{}'
    from pg_catalog.jsonb_array_elements(metadata -> 'profile_technologies') as entries(value)
    where pg_catalog.jsonb_typeof(value) = 'string'
  ) else '{}'::text[] end,
  case when pg_catalog.jsonb_typeof(metadata -> 'profile_interests') = 'array' then array(
    select value #>> '{}'
    from pg_catalog.jsonb_array_elements(metadata -> 'profile_interests') as entries(value)
    where pg_catalog.jsonb_typeof(value) = 'string'
  ) else '{}'::text[] end,
  nullif(pg_catalog.btrim(metadata ->> 'profile_about'), ''),
  pg_catalog.lower(coalesce(metadata ->> 'profile_complete', 'false')) in ('true', 't', 'yes', '1'),
  nullif(pg_catalog.btrim(coalesce(metadata ->> 'profile_branch_category', metadata ->> 'profile_branch')), ''),
  nullif(pg_catalog.btrim(metadata ->> 'profile_branch_details'), ''),
  nullif(pg_catalog.btrim(metadata ->> 'profile_experience'), ''),
  case when pg_catalog.jsonb_typeof(metadata -> 'profile_culture') = 'array' then array(
    select value #>> '{}'
    from pg_catalog.jsonb_array_elements(metadata -> 'profile_culture') as entries(value)
    where pg_catalog.jsonb_typeof(value) = 'string'
  ) else '{}'::text[] end,
  case when pg_catalog.jsonb_typeof(metadata -> 'profile_favorite_foods') = 'array' then array(
    select value #>> '{}'
    from pg_catalog.jsonb_array_elements(metadata -> 'profile_favorite_foods') as entries(value)
    where pg_catalog.jsonb_typeof(value) = 'string'
  ) else '{}'::text[] end
from auth.users as users
cross join lateral (select coalesce(users.raw_user_meta_data, '{}'::jsonb) as metadata) as source
on conflict (id) do nothing;
