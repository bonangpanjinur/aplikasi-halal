
-- Step 1: Backfill profiles from auth.users (handle_new_user trigger exists but may have failed)
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  u.email
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  email = COALESCE(EXCLUDED.email, profiles.email);

-- Step 2: Fix RLS - all policies were RESTRICTIVE, need at least one PERMISSIVE
-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Public can read profile names" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON public.profiles;

-- Recreate as PERMISSIVE with proper security (authenticated only for SELECT)
CREATE POLICY "Authenticated can read profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Super admin can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Owner can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Also fix user_roles policies - they are ALL RESTRICTIVE too
DROP POLICY IF EXISTS "Owner can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admin can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Owner can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Super admin/owner need to see ALL roles for user management
CREATE POLICY "Super admin can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Owner can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));
