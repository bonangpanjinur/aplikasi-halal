
-- ============================================================
-- Fix ALL RESTRICTIVE policies → PERMISSIVE across all tables
-- RESTRICTIVE means ALL policies must pass; with no PERMISSIVE 
-- policy, PostgreSQL denies everything. We recreate them as 
-- PERMISSIVE, keeping the same USING/WITH CHECK logic.
-- ============================================================

-- ======================== app_settings ========================
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Owner can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admin can manage settings" ON public.app_settings;

CREATE POLICY "Anyone can read app settings" ON public.app_settings
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can manage settings" ON public.app_settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage settings" ON public.app_settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== audit_logs ========================
DROP POLICY IF EXISTS "Members can view audit logs of their group" ON public.audit_logs;
DROP POLICY IF EXISTS "Owner can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Super admin can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Members can view audit logs of their group" ON public.audit_logs
  AS PERMISSIVE FOR SELECT TO authenticated USING (is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Owner can view all audit logs" ON public.audit_logs
  AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can view all audit logs" ON public.audit_logs
  AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

-- ======================== commission_rates ========================
DROP POLICY IF EXISTS "Authenticated can view rates" ON public.commission_rates;
DROP POLICY IF EXISTS "Owner can manage rates" ON public.commission_rates;
DROP POLICY IF EXISTS "Super admin can manage rates" ON public.commission_rates;

CREATE POLICY "Authenticated can view rates" ON public.commission_rates
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can manage rates" ON public.commission_rates
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage rates" ON public.commission_rates
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== commissions ========================
DROP POLICY IF EXISTS "Admin can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admin can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admin can view all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Owner can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Owner can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Owner can view all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Super admin can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Super admin can view all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can view own commissions" ON public.commissions;

CREATE POLICY "Users can view own commissions" ON public.commissions
  AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can view all commissions" ON public.commissions
  AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner can view all commissions" ON public.commissions
  AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can view all commissions" ON public.commissions
  AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admin can insert commissions" ON public.commissions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner can insert commissions" ON public.commissions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admin can update commissions" ON public.commissions
  AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner can update commissions" ON public.commissions
  AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can update commissions" ON public.commissions
  AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== data_entries ========================
DROP POLICY IF EXISTS "Admin input can update group entries" ON public.data_entries;
DROP POLICY IF EXISTS "Admin input can view group entries" ON public.data_entries;
DROP POLICY IF EXISTS "Members can delete group entries" ON public.data_entries;
DROP POLICY IF EXISTS "Members can insert group entries" ON public.data_entries;
DROP POLICY IF EXISTS "Members can update group entries" ON public.data_entries;
DROP POLICY IF EXISTS "Members can view group entries" ON public.data_entries;
DROP POLICY IF EXISTS "Owner full access to entries" ON public.data_entries;
DROP POLICY IF EXISTS "Public can view entries by tracking code" ON public.data_entries;
DROP POLICY IF EXISTS "Super admin full access to entries" ON public.data_entries;
DROP POLICY IF EXISTS "UMKM can view own entries" ON public.data_entries;

CREATE POLICY "Members can view group entries" ON public.data_entries
  AS PERMISSIVE FOR SELECT TO authenticated USING (is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Admin input can view group entries" ON public.data_entries
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin_input'::app_role) AND is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Members can insert group entries" ON public.data_entries
  AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Members can update group entries" ON public.data_entries
  AS PERMISSIVE FOR UPDATE TO authenticated USING (is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Admin input can update group entries" ON public.data_entries
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin_input'::app_role) AND is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Members can delete group entries" ON public.data_entries
  AS PERMISSIVE FOR DELETE TO authenticated USING (is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Owner full access to entries" ON public.data_entries
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin full access to entries" ON public.data_entries
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Public can view entries by tracking code" ON public.data_entries
  AS PERMISSIVE FOR SELECT TO anon, authenticated USING (tracking_code IS NOT NULL);
CREATE POLICY "UMKM can view own entries" ON public.data_entries
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'umkm'::app_role) AND umkm_user_id = auth.uid());

-- ======================== disbursements ========================
DROP POLICY IF EXISTS "Admin can manage disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Owner can manage disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Super admin can manage disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Users can view own disbursements" ON public.disbursements;

CREATE POLICY "Users can view own disbursements" ON public.disbursements
  AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage disbursements" ON public.disbursements
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner can manage disbursements" ON public.disbursements
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage disbursements" ON public.disbursements
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== entry_photos ========================
DROP POLICY IF EXISTS "Admin input can insert entry photos" ON public.entry_photos;
DROP POLICY IF EXISTS "Admin input can view entry photos" ON public.entry_photos;
DROP POLICY IF EXISTS "Members can delete entry photos" ON public.entry_photos;
DROP POLICY IF EXISTS "Members can insert entry photos" ON public.entry_photos;
DROP POLICY IF EXISTS "Members can view entry photos" ON public.entry_photos;
DROP POLICY IF EXISTS "Owner full access to entry photos" ON public.entry_photos;
DROP POLICY IF EXISTS "Super admin full access to entry photos" ON public.entry_photos;

CREATE POLICY "Members can view entry photos" ON public.entry_photos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM data_entries de WHERE de.id = entry_photos.entry_id AND is_member_of_group(auth.uid(), de.group_id)));
CREATE POLICY "Admin input can view entry photos" ON public.entry_photos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin_input'::app_role) AND EXISTS (SELECT 1 FROM data_entries de WHERE de.id = entry_photos.entry_id AND is_member_of_group(auth.uid(), de.group_id)));
CREATE POLICY "Members can insert entry photos" ON public.entry_photos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM data_entries de WHERE de.id = entry_photos.entry_id AND is_member_of_group(auth.uid(), de.group_id)));
CREATE POLICY "Admin input can insert entry photos" ON public.entry_photos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_input'::app_role) AND EXISTS (SELECT 1 FROM data_entries de WHERE de.id = entry_photos.entry_id AND is_member_of_group(auth.uid(), de.group_id)));
CREATE POLICY "Members can delete entry photos" ON public.entry_photos
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM data_entries de WHERE de.id = entry_photos.entry_id AND is_member_of_group(auth.uid(), de.group_id)));
CREATE POLICY "Owner full access to entry photos" ON public.entry_photos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin full access to entry photos" ON public.entry_photos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== field_access ========================
DROP POLICY IF EXISTS "Authenticated users can view field access" ON public.field_access;
DROP POLICY IF EXISTS "Owner can manage field access" ON public.field_access;
DROP POLICY IF EXISTS "Public can read field access" ON public.field_access;
DROP POLICY IF EXISTS "Super admin can manage field access" ON public.field_access;

CREATE POLICY "Public can read field access" ON public.field_access
  AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner can manage field access" ON public.field_access
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage field access" ON public.field_access
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== group_members ========================
DROP POLICY IF EXISTS "Admin input can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Owner can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Super admin can manage group members" ON public.group_members;

CREATE POLICY "Members can view group members" ON public.group_members
  AS PERMISSIVE FOR SELECT TO authenticated USING (is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Admin input can view group members" ON public.group_members
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_member_of_group(auth.uid(), group_id) AND has_role(auth.uid(), 'admin_input'::app_role));
CREATE POLICY "Owner can manage group members" ON public.group_members
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage group members" ON public.group_members
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== groups ========================
DROP POLICY IF EXISTS "Admin input can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Owner can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Super admin can manage groups" ON public.groups;

CREATE POLICY "Members can view their groups" ON public.groups
  AS PERMISSIVE FOR SELECT TO authenticated USING (is_member_of_group(auth.uid(), id));
CREATE POLICY "Admin input can view their groups" ON public.groups
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_member_of_group(auth.uid(), id) AND has_role(auth.uid(), 'admin_input'::app_role));
CREATE POLICY "Owner can manage groups" ON public.groups
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage groups" ON public.groups
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== notifications ========================
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications
  AS PERMISSIVE FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications
  AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

-- ======================== platform_billing ========================
DROP POLICY IF EXISTS "Owner can view own billing" ON public.platform_billing;
DROP POLICY IF EXISTS "Super admin can manage platform billing" ON public.platform_billing;

CREATE POLICY "Owner can view own billing" ON public.platform_billing
  AS PERMISSIVE FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Super admin can manage platform billing" ON public.platform_billing
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== shared_links ========================
DROP POLICY IF EXISTS "Admin input can view shared links" ON public.shared_links;
DROP POLICY IF EXISTS "Members can view shared links" ON public.shared_links;
DROP POLICY IF EXISTS "Owner can manage shared links" ON public.shared_links;
DROP POLICY IF EXISTS "Public can read active shared links" ON public.shared_links;
DROP POLICY IF EXISTS "Super admin can manage shared links" ON public.shared_links;
DROP POLICY IF EXISTS "Users can manage own shared links" ON public.shared_links;

CREATE POLICY "Public can read active shared links" ON public.shared_links
  AS PERMISSIVE FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Members can view shared links" ON public.shared_links
  AS PERMISSIVE FOR SELECT TO authenticated USING (is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Admin input can view shared links" ON public.shared_links
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin_input'::app_role) AND is_member_of_group(auth.uid(), group_id));
CREATE POLICY "Users can manage own shared links" ON public.shared_links
  AS PERMISSIVE FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can manage shared links" ON public.shared_links
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage shared links" ON public.shared_links
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== profiles (fix remaining RESTRICTIVE) ========================
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated can read profiles" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
  AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Owner can manage profiles" ON public.profiles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage profiles" ON public.profiles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ======================== user_roles (fix remaining RESTRICTIVE) ========================
DROP POLICY IF EXISTS "Owner can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admin can view all roles" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Owner can view all roles" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Super admin can manage roles" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Owner can manage roles" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
