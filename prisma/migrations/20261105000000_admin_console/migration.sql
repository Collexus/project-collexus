-- Additive admin-console data structures. Existing role and submission rows
-- are preserved and copied into the multi-role assignment table.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default pg_catalog.now()
);

create table if not exists public.event_submissions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  organizer_id uuid not null references auth.users (id) on delete cascade,
  submission jsonb not null check (pg_catalog.jsonb_typeof(submission) = 'object'),
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.event_submissions
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create table if not exists public.user_role_assignments (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role varchar(32) not null check (role in ('student', 'admin', 'event_organizer', 'staff', 'stall_operator')),
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  revoked_at timestamptz,
  constraint user_role_assignments_user_role_key unique (user_id, role)
);

create index if not exists user_role_assignments_user_active_idx
  on public.user_role_assignments (user_id, revoked_at);
create index if not exists user_role_assignments_role_active_idx
  on public.user_role_assignments (role, revoked_at);

create table if not exists public.staff_event_assignments (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  staff_user_id uuid not null references auth.users (id) on delete cascade,
  event_slug varchar(120) not null,
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  revoked_at timestamptz,
  constraint staff_event_assignments_user_event_key unique (staff_user_id, event_slug)
);

create index if not exists staff_event_assignments_event_active_idx
  on public.staff_event_assignments (event_slug, revoked_at);
create index if not exists staff_event_assignments_user_active_idx
  on public.staff_event_assignments (staff_user_id, revoked_at);

insert into public.user_role_assignments (user_id, role, created_at)
select user_id, case when role = 'admin' then 'admin' else 'student' end, created_at
from public.user_roles
on conflict (user_id, role) do nothing;

create table if not exists public.admin_audit_logs (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  actor_id uuid not null,
  action varchar(80) not null,
  resource_type varchar(50) not null,
  resource_id uuid,
  previous_values jsonb check (previous_values is null or pg_catalog.jsonb_typeof(previous_values) = 'object'),
  new_values jsonb check (new_values is null or pg_catalog.jsonb_typeof(new_values) = 'object'),
  created_at timestamptz not null default pg_catalog.now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_created_idx
  on public.admin_audit_logs (actor_id, created_at desc);

alter table public.user_role_assignments enable row level security;
alter table public.staff_event_assignments enable row level security;
alter table public.admin_audit_logs enable row level security;
revoke all on table public.user_role_assignments from public, anon, authenticated;
revoke all on table public.staff_event_assignments from public, anon, authenticated;
revoke all on table public.admin_audit_logs from public, anon, authenticated;
