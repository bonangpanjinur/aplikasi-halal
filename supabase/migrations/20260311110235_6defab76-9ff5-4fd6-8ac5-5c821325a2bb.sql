
-- 1. Create trigger for handle_new_user on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Backfill profiles for existing users
INSERT INTO public.profiles (id, full_name, email)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Add trial columns to platform_billing
ALTER TABLE public.platform_billing 
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS trial_start timestamp with time zone DEFAULT now();
