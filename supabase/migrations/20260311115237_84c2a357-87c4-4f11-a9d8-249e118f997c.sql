
CREATE POLICY "Public can read field access"
ON public.field_access
FOR SELECT
TO public
USING (true);
