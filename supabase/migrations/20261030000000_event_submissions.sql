-- Organizer event submissions are private to the review workflow until approved.
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
grant insert (id, organizer_id, submission) on public.event_submissions to authenticated;

drop policy if exists "event_submissions_insert_own" on public.event_submissions;
create policy "event_submissions_insert_own"
  on public.event_submissions for insert to authenticated
  with check ((select auth.uid()) = organizer_id and status = 'pending_review');

create or replace function public.set_event_submission_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_event_submission_updated_at() from public, anon, authenticated;
drop trigger if exists set_event_submission_updated_at on public.event_submissions;
create trigger set_event_submission_updated_at
  before update on public.event_submissions
  for each row execute function public.set_event_submission_updated_at();
