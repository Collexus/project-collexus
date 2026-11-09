-- Additive stall administration tables. No existing records are altered.
create table if not exists public.food_stalls (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  name varchar(160) not null,
  slug varchar(120) not null unique,
  description varchar(600),
  category varchar(80) not null,
  event_slug varchar(120),
  location varchar(200),
  status varchar(16) not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create index if not exists food_stalls_status_created_idx
  on public.food_stalls (status, created_at desc);

create table if not exists public.food_menu_items (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  stall_id uuid not null references public.food_stalls (id) on delete cascade,
  name varchar(120) not null,
  description varchar(300),
  price_paise integer not null check (price_paise >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create index if not exists food_menu_items_stall_available_idx
  on public.food_menu_items (stall_id, is_available);

create table if not exists public.food_stall_operator_assignments (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  stall_id uuid not null references public.food_stalls (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  revoked_at timestamptz,
  constraint food_stall_operator_assignments_stall_user_key unique (stall_id, user_id)
);

create index if not exists food_stall_operator_assignments_user_active_idx
  on public.food_stall_operator_assignments (user_id, revoked_at);
create index if not exists food_stall_operator_assignments_stall_active_idx
  on public.food_stall_operator_assignments (stall_id, revoked_at);

alter table public.food_stalls enable row level security;
alter table public.food_menu_items enable row level security;
alter table public.food_stall_operator_assignments enable row level security;

revoke all on table public.food_stalls from public, anon, authenticated;
revoke all on table public.food_menu_items from public, anon, authenticated;
revoke all on table public.food_stall_operator_assignments from public, anon, authenticated;
