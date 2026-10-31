alter table public.profiles
  add column if not exists profile_phone text,
  add column if not exists profile_avatar_url text,
  add column if not exists profile_organization text,
  add column if not exists profile_address text;

grant update (
  profile_phone,
  profile_avatar_url,
  profile_organization,
  profile_address
) on table public.profiles to authenticated;

update public.profiles as profile
set
  profile_phone = coalesce(profile.profile_phone, nullif(pg_catalog.btrim(users.raw_user_meta_data ->> 'phone_number'), '')),
  profile_avatar_url = coalesce(profile.profile_avatar_url, nullif(pg_catalog.btrim(users.raw_user_meta_data ->> 'avatar_url'), '')),
  profile_organization = coalesce(profile.profile_organization, nullif(pg_catalog.btrim(users.raw_user_meta_data ->> 'organization'), '')),
  profile_address = coalesce(profile.profile_address, nullif(pg_catalog.btrim(users.raw_user_meta_data ->> 'address'), ''))
from auth.users as users
where profile.id = users.id;
