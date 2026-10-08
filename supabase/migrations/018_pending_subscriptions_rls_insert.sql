-- Allow authenticated users to create their own pending subscriptions
CREATE POLICY "Users can insert own pending subscriptions"
  ON pending_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
