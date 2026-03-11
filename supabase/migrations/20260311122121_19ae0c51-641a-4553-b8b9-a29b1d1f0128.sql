-- Fix: super_admin field_access policy missing WITH CHECK
DROP POLICY IF EXISTS "Super admin can manage field access" ON public.field_access;
CREATE POLICY "Super admin can manage field access"
ON public.field_access
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix: super_admin group_members policy missing WITH CHECK
DROP POLICY IF EXISTS "Super admin can manage group members" ON public.group_members;
CREATE POLICY "Super admin can manage group members"
ON public.group_members
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix: super_admin groups policy missing WITH CHECK
DROP POLICY IF EXISTS "Super admin can manage groups" ON public.groups;
CREATE POLICY "Super admin can manage groups"
ON public.groups
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix: super_admin shared_links policy missing WITH CHECK
DROP POLICY IF EXISTS "Super admin can manage shared links" ON public.shared_links;
CREATE POLICY "Super admin can manage shared links"
ON public.shared_links
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix: super_admin data_entries policy missing WITH CHECK  
DROP POLICY IF EXISTS "Super admin full access to entries" ON public.data_entries;
CREATE POLICY "Super admin full access to entries"
ON public.data_entries
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix: super_admin entry_photos policy missing WITH CHECK
DROP POLICY IF EXISTS "Super admin full access to entry photos" ON public.entry_photos;
CREATE POLICY "Super admin full access to entry photos"
ON public.entry_photos
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix: super_admin user_roles policy missing WITH CHECK
DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
CREATE POLICY "Super admin can manage roles"
ON public.user_roles
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));