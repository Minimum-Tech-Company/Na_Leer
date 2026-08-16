-- Add DELETE policy for subscriptions: users can cancel their own
DO $$ begin
  create policy "Users can cancel own subscriptions" on public.subscriptions
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
