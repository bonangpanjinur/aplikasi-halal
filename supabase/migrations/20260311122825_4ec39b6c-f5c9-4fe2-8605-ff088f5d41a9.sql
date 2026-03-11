-- Fix: Change restrictive SELECT policy to permissive on profiles
DROP POLICY IF EXISTS "Public can read profile names" ON public.profiles;
CREATE POLICY "Public can read profile names"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Also fix other profiles policies to be permissive
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO public
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Owner can delete profiles" ON public.profiles;
CREATE POLICY "Owner can delete profiles"
ON public.profiles
FOR DELETE
TO public
USING (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can insert profiles" ON public.profiles;
CREATE POLICY "Owner can insert profiles"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles"
ON public.profiles
FOR DELETE
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admin can insert profiles" ON public.profiles;
CREATE POLICY "Super admin can insert profiles"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR id = auth.uid());