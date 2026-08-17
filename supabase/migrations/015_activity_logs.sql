-- Activity logs table for Business plan multi-user tracking
create table if not exists public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  details jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);
create index if not exists idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);

-- RLS: members of the same company can see each other's logs
alter table public.activity_logs enable row level security;

create policy "Team members can view same company logs"
  on public.activity_logs for select
  using (
    exists (
      select 1 from public.profiles p1
      join public.profiles p2 on p1.company_name = p2.company_name
      where p1.id = auth.uid()
      and p2.id = activity_logs.user_id
    )
  );

create policy "Users can insert own activity logs"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);
