-- Migration 004: Add FedaPay fields to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_api_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_secret_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_environment TEXT DEFAULT 'sandbox' CHECK (fedaipay_environment IN ('sandbox', 'live'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fedaipay_webhook_secret TEXT;
