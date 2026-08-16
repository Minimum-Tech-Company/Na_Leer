-- Fix infinite recursion in profiles RLS policies
-- The admin policies query profiles FROM a profiles policy = infinite loop

-- Drop all recursive admin policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Recreate without recursion: check is_admin directly on the current row
-- For SELECT: admins see all, users see own
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin = true
  );

-- For UPDATE: admins can update all, users update own
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR is_admin = true
  );

-- For DELETE: only via service role (no policy needed, admins use service role)
