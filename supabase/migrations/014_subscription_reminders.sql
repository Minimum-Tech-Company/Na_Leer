-- Add reminder tracking to subscriptions
alter table public.subscriptions
add column if not exists last_reminder_sent_at timestamptz;

-- Index for expiry checks
create index if not exists idx_subscriptions_expiry
on public.subscriptions (user_id, expires_at, status);
