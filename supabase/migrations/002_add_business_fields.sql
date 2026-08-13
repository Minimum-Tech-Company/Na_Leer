-- Add missing columns to profiles table for complete business info
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rccm text,
  ADD COLUMN IF NOT EXISTS forme_juridique text DEFAULT 'SARL',
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS pays text DEFAULT 'Sénégal';
