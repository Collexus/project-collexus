-- Persist stall applications and connect an approved application to its stall.
create table if not exists public.stall_submissions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  submitter_id uuid not null references auth.users (id) on delete cascade,
  request_data jsonb not null check (pg_catalog.jsonb_typeof(request_data) = 'object'),
  status varchar(24) not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_stall_id uuid unique references public.food_stalls (id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create index if not exists stall_submissions_status_created_idx
  on public.stall_submissions (status, created_at desc);
create index if not exists stall_submissions_submitter_created_idx
  on public.stall_submissions (submitter_id, created_at desc);

alter table public.stall_submissions enable row level security;
revoke all on table public.stall_submissions from public, anon, authenticated;
