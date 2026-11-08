create table if not exists public.host_stall_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  listing_name varchar(160) not null,
  stall_type varchar(32) not null check (stall_type in ('Silver stall', 'Gold stall', 'Platinum stall')),
  plan varchar(16) not null check (plan in ('normal', 'pro')),
  add_ons jsonb not null default '[]'::jsonb check (jsonb_typeof(add_ons) = 'array'),
  amount_paise integer not null check (amount_paise >= 100),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  status varchar(24) not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'payment_failed', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists host_stall_orders_user_created_idx on public.host_stall_orders(user_id, created_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  purchase_type varchar(32) not null check (purchase_type in ('host_stall', 'event_registration', 'food_order')),
  purchase_id uuid not null,
  amount_paise integer not null check (amount_paise >= 100),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  status varchar(24) not null default 'created' check (status in ('created', 'pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id varchar(64) unique,
  razorpay_payment_id varchar(64),
  idempotency_key uuid not null,
  request_hash char(64) not null,
  order_creation_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_user_idempotency_key unique(user_id, idempotency_key)
);
create index if not exists payments_purchase_idx on public.payments(purchase_type, purchase_id);
create index if not exists payments_status_created_idx on public.payments(status, created_at desc);

create table if not exists public.payment_webhook_events (
  event_id varchar(200) primary key,
  event_type varchar(100) not null,
  payload_hash char(64) not null,
  processing_status varchar(24) not null default 'received' check (processing_status in ('received', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.host_stall_orders enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;

create or replace function public.sync_host_stall_payment_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.purchase_type = 'host_stall' and new.status in ('paid', 'failed', 'refunded') then
    update public.host_stall_orders
      set status = case new.status when 'paid' then 'paid' when 'refunded' then 'refunded' else 'payment_failed' end,
          updated_at = now()
      where id = new.purchase_id and user_id = new.user_id;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_host_stall_payment_status on public.payments;
create trigger sync_host_stall_payment_status after insert or update of status on public.payments
for each row execute function public.sync_host_stall_payment_status();

