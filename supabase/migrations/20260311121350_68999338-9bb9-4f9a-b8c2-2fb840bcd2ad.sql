
-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

-- Auto-generate referral code for new profiles
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      code := upper(substr(md5(random()::text), 1, 6));
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_check;
      EXIT WHEN NOT exists_check;
    END LOOP;
    NEW.referral_code := code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Generate referral codes for existing profiles
UPDATE public.profiles 
SET referral_code = upper(substr(md5(id::text || random()::text), 1, 6))
WHERE referral_code IS NULL;

-- Add referred_by to data_entries
ALTER TABLE public.data_entries ADD COLUMN IF NOT EXISTS referred_by text;
