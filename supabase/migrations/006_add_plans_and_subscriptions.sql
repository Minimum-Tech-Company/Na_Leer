-- Plans table
create table if not exists public.plans (
  id text primary key,
  name text not null,
  price_xof integer not null default 0,
  max_invoices integer,
  max_clients integer,
  has_online_payments boolean default false,
  has_auto_reminders boolean default false,
  has_multi_users boolean default false,
  has_api_access boolean default false,
  created_at timestamptz default now()
);

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id text references public.plans(id) not null,
  status text default 'active' check (status in ('active', 'cancelled', 'expired', 'pending')),
  started_at timestamptz default now(),
  expires_at timestamptz,
  dexchange_transaction_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

-- RLS policies (avec IF NOT EXISTS via DO block)
do $$ begin
  alter table public.plans enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.subscriptions enable row level security;
exception when others then null;
end $$;

do $$ begin
  create policy "Plans are readable by everyone" on public.plans
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can view own subscriptions" on public.subscriptions
    for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can create own subscriptions" on public.subscriptions
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own subscriptions" on public.subscriptions
    for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Seed data: Plans
insert into public.plans (id, name, price_xof, max_invoices, max_clients, has_online_payments, has_auto_reminders, has_multi_users, has_api_access)
values
  ('free', 'Gratuit', 0, 3, 5, false, false, false, false),
  ('pro', 'Pro', 15000, -1, -1, true, true, false, false),
  ('business', 'Business', 35000, -1, -1, true, true, true, true)
on conflict (id) do update set
  name = excluded.name,
  price_xof = excluded.price_xof,
  max_invoices = excluded.max_invoices,
  max_clients = excluded.max_clients,
  has_online_payments = excluded.has_online_payments,
  has_auto_reminders = excluded.has_auto_reminders,
  has_multi_users = excluded.has_multi_users,
  has_api_access = excluded.has_api_access;
