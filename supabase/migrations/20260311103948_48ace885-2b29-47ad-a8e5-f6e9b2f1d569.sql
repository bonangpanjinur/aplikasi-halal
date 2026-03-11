
-- Create billing_type enum
DO $$ BEGIN
  CREATE TYPE public.billing_type AS ENUM ('per_sertifikat', 'per_bulan', 'per_group');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create platform_billing table
CREATE TABLE IF NOT EXISTS public.platform_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  billing_type public.billing_type NOT NULL DEFAULT 'per_sertifikat',
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage platform billing"
  ON public.platform_billing FOR ALL TO public
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owner can view own billing"
  ON public.platform_billing FOR SELECT TO public
  USING (owner_user_id = auth.uid());

-- Owner RLS policies on existing tables
CREATE POLICY "Owner full access to entries"
  ON public.data_entries FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage groups"
  ON public.groups FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage group members"
  ON public.group_members FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can view all commissions"
  ON public.commissions FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update commissions"
  ON public.commissions FOR UPDATE TO public
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can insert commissions"
  ON public.commissions FOR INSERT TO public
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage shared links"
  ON public.shared_links FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can view all audit logs"
  ON public.audit_logs FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner full access to entry photos"
  ON public.entry_photos FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage field access"
  ON public.field_access FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage rates"
  ON public.commission_rates FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage roles"
  ON public.user_roles FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can insert profiles"
  ON public.profiles FOR INSERT TO public
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can delete profiles"
  ON public.profiles FOR DELETE TO public
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can manage disbursements"
  ON public.disbursements FOR ALL TO public
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_platform_billing_updated_at
  BEFORE UPDATE ON public.platform_billing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
