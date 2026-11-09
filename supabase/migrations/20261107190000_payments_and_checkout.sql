-- Additive purchase, event ticket, and payment records for trusted checkout.
-- Prices are stored in paise and copied to purchases at the time of checkout.

create table if not exists public.food_stalls (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  name varchar(160) not null,
  slug varchar(120) not null unique,
  description varchar(600),
  category varchar(80) not null,
  event_slug varchar(120),
  location varchar(200),
  status varchar(16) not null default 'draft' check (status in ('draft','active','paused','archived')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);
create table if not exists public.food_menu_items (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  stall_id uuid not null references public.food_stalls(id) on delete cascade,
  name varchar(120) not null,
  description varchar(300),
  price_paise integer not null check (price_paise >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);
create index if not exists food_menu_items_stall_available_idx on public.food_menu_items(stall_id,is_available);

create table if not exists public.food_stall_operator_assignments (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  stall_id uuid not null references public.food_stalls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  revoked_at timestamptz,
  constraint food_stall_operator_assignments_stall_user_key unique(stall_id,user_id)
);
create index if not exists food_stall_operator_assignments_user_active_idx on public.food_stall_operator_assignments(user_id,revoked_at);
create index if not exists food_stall_operator_assignments_stall_active_idx on public.food_stall_operator_assignments(stall_id,revoked_at);

create table if not exists public.stall_submissions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  submitter_id uuid not null references auth.users(id) on delete cascade,
  request_data jsonb not null check (pg_catalog.jsonb_typeof(request_data) = 'object'),
  status varchar(24) not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_stall_id uuid unique references public.food_stalls(id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);
create index if not exists stall_submissions_status_created_idx on public.stall_submissions(status,created_at desc);
create index if not exists stall_submissions_submitter_created_idx on public.stall_submissions(submitter_id,created_at desc);

create table if not exists public.event_ticket_types (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  event_slug varchar(120) not null,
  event_title varchar(200) not null,
  name varchar(120) not null,
  description varchar(500),
  price_paise integer not null check (price_paise >= 100),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  is_active boolean not null default false,
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint event_ticket_types_event_name_key unique(event_slug,name)
);
create index if not exists event_ticket_types_active_idx on public.event_ticket_types(event_slug,is_active,sales_start_at,sales_end_at);

create table if not exists public.event_registrations (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  ticket_type_id uuid not null references public.event_ticket_types(id) on delete restrict,
  event_slug varchar(120) not null,
  event_title varchar(200) not null,
  ticket_name varchar(120) not null,
  attendee_name varchar(160) not null,
  attendee_email varchar(320) not null,
  attendee_phone varchar(40) not null,
  amount_paise integer not null check (amount_paise >= 100),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  status varchar(24) not null default 'pending_payment' check (status in ('pending_payment','confirmed','payment_failed','cancelled','refunded')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);
create index if not exists event_registrations_user_created_idx on public.event_registrations(user_id,created_at desc);
create index if not exists event_registrations_event_status_idx on public.event_registrations(event_slug,status);

create or replace function public.validate_event_registration_ticket()
returns trigger language plpgsql security definer set search_path = '' as $$
declare ticket public.event_ticket_types%rowtype;
declare occupied integer;
begin
  select * into ticket from public.event_ticket_types where id = new.ticket_type_id for update;
  if not found or not ticket.is_active or ticket.price_paise <> new.amount_paise or ticket.event_slug <> new.event_slug then
    raise exception 'Ticket is unavailable or its price changed.' using errcode = '23514';
  end if;
  if (ticket.sales_start_at is not null and ticket.sales_start_at > pg_catalog.now()) or
     (ticket.sales_end_at is not null and ticket.sales_end_at <= pg_catalog.now()) then
    raise exception 'Ticket sales are closed.' using errcode = '23514';
  end if;
  if ticket.capacity is not null then
    select count(*)::integer into occupied from public.event_registrations
    where ticket_type_id = ticket.id and (status = 'confirmed' or (status = 'pending_payment' and created_at > pg_catalog.now() - interval '15 minutes'));
    if occupied >= ticket.capacity then raise exception 'Ticket is sold out.' using errcode = '23514'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists event_registrations_validate_ticket on public.event_registrations;
create trigger event_registrations_validate_ticket before insert on public.event_registrations
for each row execute function public.validate_event_registration_ticket();

create table if not exists public.food_orders (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  stall_id uuid not null references public.food_stalls(id) on delete restrict,
  status varchar(24) not null default 'pending_payment' check (status in ('pending_payment','confirmed','preparing','ready','collected','cancelled','payment_failed','refunded')),
  subtotal_paise integer not null check (subtotal_paise >= 100),
  amount_paise integer not null check (amount_paise = subtotal_paise),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  customer_name varchar(160) not null,
  customer_phone varchar(40) not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);
create index if not exists food_orders_user_created_idx on public.food_orders(user_id,created_at desc);
create index if not exists food_orders_stall_status_idx on public.food_orders(stall_id,status,created_at);
create table if not exists public.food_order_items (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  order_id uuid not null references public.food_orders(id) on delete cascade,
  menu_item_id uuid references public.food_menu_items(id) on delete set null,
  item_name varchar(120) not null,
  unit_price_paise integer not null check (unit_price_paise >= 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total_paise integer not null check (line_total_paise = unit_price_paise * quantity),
  created_at timestamptz not null default pg_catalog.now()
);
create index if not exists food_order_items_order_idx on public.food_order_items(order_id);

create table if not exists public.payments (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  purchase_type varchar(24) not null check (purchase_type in ('event_registration','food_order')),
  purchase_id uuid not null,
  idempotency_key uuid not null,
  request_hash char(64) not null,
  amount_paise integer not null check (amount_paise >= 100),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  status varchar(16) not null default 'created' check (status in ('created','pending','paid','failed','refunded')),
  razorpay_order_id varchar(64) unique,
  razorpay_payment_id varchar(64) unique,
  order_creation_started_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);
create index if not exists payments_user_created_idx on public.payments(user_id,created_at desc);
create index if not exists payments_purchase_idx on public.payments(purchase_type,purchase_id);
create unique index if not exists payments_user_idempotency_key on public.payments(user_id,idempotency_key);
create table if not exists public.payment_webhook_events (
  event_id varchar(200) primary key,
  event_type varchar(80) not null,
  payload_hash char(64) not null,
  processing_status varchar(16) not null default 'received' check (processing_status in ('received','processed','failed')),
  received_at timestamptz not null default pg_catalog.now(),
  processed_at timestamptz
);

create or replace function public.sync_purchase_payment_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    if new.purchase_type = 'event_registration' then
      update public.event_registrations set status = 'confirmed', updated_at = pg_catalog.now()
      where id = new.purchase_id and user_id = new.user_id and status = 'pending_payment';
    elsif new.purchase_type = 'food_order' then
      update public.food_orders set status = 'confirmed', updated_at = pg_catalog.now()
      where id = new.purchase_id and user_id = new.user_id and status = 'pending_payment';
    end if;
  elsif new.status = 'failed' and old.status is distinct from 'failed' then
    if new.purchase_type = 'event_registration' then
      update public.event_registrations set status = 'payment_failed', updated_at = pg_catalog.now()
      where id = new.purchase_id and user_id = new.user_id and status = 'pending_payment';
    elsif new.purchase_type = 'food_order' then
      update public.food_orders set status = 'payment_failed', updated_at = pg_catalog.now()
      where id = new.purchase_id and user_id = new.user_id and status = 'pending_payment';
    end if;
  end if;
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
drop trigger if exists payments_sync_purchase_status on public.payments;
create trigger payments_sync_purchase_status before update of status on public.payments
for each row execute function public.sync_purchase_payment_status();

alter table public.food_stalls enable row level security;
alter table public.food_menu_items enable row level security;
alter table public.food_stall_operator_assignments enable row level security;
alter table public.stall_submissions enable row level security;
alter table public.event_ticket_types enable row level security;
alter table public.event_registrations enable row level security;
alter table public.food_orders enable row level security;
alter table public.food_order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;
revoke all on public.food_stalls, public.food_menu_items, public.food_stall_operator_assignments,
  public.stall_submissions, public.event_ticket_types, public.event_registrations, public.food_orders, public.food_order_items,
  public.payments, public.payment_webhook_events from public, anon, authenticated;
revoke all on function public.sync_purchase_payment_status(), public.validate_event_registration_ticket() from public, anon, authenticated;
