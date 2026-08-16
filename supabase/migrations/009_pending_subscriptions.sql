CREATE TABLE IF NOT EXISTS pending_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  amount_xof INTEGER NOT NULL,
  provider TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pending_subscriptions_reference ON pending_subscriptions(reference);
CREATE INDEX idx_pending_subscriptions_user_id ON pending_subscriptions(user_id);

CREATE POLICY "Users can view own pending subscriptions"
  ON pending_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage pending subscriptions"
  ON pending_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
