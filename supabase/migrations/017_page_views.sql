-- Page views tracking for real-time visitor counter
create table if not exists public.page_views (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null,
  path text,
  referrer text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_page_views_created_at on public.page_views(created_at desc);
create index if not exists idx_page_views_session on public.page_views(session_id);

alter table public.page_views enable row level security;

-- No select/insert policies: only the service role (API route) can access this table
