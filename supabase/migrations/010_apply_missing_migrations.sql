-- =============================================
-- MIGRATION 003: Business features
-- =============================================

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, user_id)
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Team owners can view their members" ON team_members FOR SELECT USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Team owners can insert members" ON team_members FOR INSERT WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Team owners can update members" ON team_members FOR UPDATE USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Team owners can delete members" ON team_members FOR DELETE USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Members can view own membership" ON team_members FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- INVITATIONS
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Team owners can view their invitations" ON invitations FOR SELECT USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Team owners can create invitations" ON invitations FOR INSERT WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Team owners can delete their invitations" ON invitations FOR DELETE USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own API keys" ON api_keys FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create API keys" ON api_keys FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own API keys" ON api_keys FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete their own API keys" ON api_keys FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- INVOICE TEMPLATES
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mon template',
  primary_color TEXT NOT NULL DEFAULT '#2563EB',
  accent_color TEXT NOT NULL DEFAULT '#1E40AF',
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_tax_id BOOLEAN NOT NULL DEFAULT true,
  show_rccm BOOLEAN NOT NULL DEFAULT true,
  footer_text TEXT DEFAULT 'Merci pour votre paiement',
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own templates" ON invoice_templates FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create templates" ON invoice_templates FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own templates" ON invoice_templates FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete their own templates" ON invoice_templates FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_business BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own tickets" ON support_tickets FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- template_id on invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES invoice_templates(id);

-- team_owner_id on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_owner_id UUID REFERENCES profiles(id);

-- =============================================
-- MIGRATION 004: FedaPay fields
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_api_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_secret_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_environment TEXT DEFAULT 'sandbox' CHECK (fedaipay_environment IN ('sandbox', 'live'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_webhook_secret TEXT;

-- =============================================
-- MIGRATION 006 fix: missing column
-- =============================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS dexchange_transaction_id TEXT;

-- =============================================
-- MIGRATION 008 fix: DELETE policy
-- =============================================
DO $$ BEGIN
  CREATE POLICY "Users can cancel own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
