-- Additive, safe to apply after the Supabase SQL migrations. Existing event
-- submissions are preserved; this migration only creates missing structures.
create table if not exists public.event_submissions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  organizer_id uuid not null references auth.users (id) on delete cascade,
  submission jsonb not null check (pg_catalog.jsonb_typeof(submission) = 'object'),
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create index if not exists event_submissions_organizer_created_idx
  on public.event_submissions (organizer_id, created_at desc);

alter table public.event_submissions enable row level security;
revoke all on table public.event_submissions from public, anon, authenticated;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default pg_catalog.now()
);

alter table public.user_roles enable row level security;
revoke all on table public.user_roles from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-posters', 'event-posters', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "event_posters_select_own" on storage.objects;
create policy "event_posters_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'event-posters' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "event_posters_insert_own" on storage.objects;
create policy "event_posters_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-posters' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "event_posters_delete_own" on storage.objects;
create policy "event_posters_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'event-posters' and (storage.foldername(name))[1] = (select auth.uid())::text);
