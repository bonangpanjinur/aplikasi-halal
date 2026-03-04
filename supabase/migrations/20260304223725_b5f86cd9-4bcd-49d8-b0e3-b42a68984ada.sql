
CREATE OR REPLACE FUNCTION public.auto_create_commission_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  changer_id uuid;
  changer_role app_role;
  rate integer;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    changer_id := auth.uid();
    IF changer_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT role INTO changer_role FROM public.user_roles WHERE user_id = changer_id LIMIT 1;
    IF changer_role IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT amount_per_entry INTO rate FROM public.commission_rates WHERE role = changer_role;
    IF rate IS NOT NULL AND rate > 0 THEN
      INSERT INTO public.commissions (user_id, entry_id, group_id, amount, period)
      VALUES (changer_id, NEW.id, NEW.group_id, rate, to_char(now(), 'YYYY-MM'))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Add unique constraint to prevent duplicate commissions per user per entry
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commissions_user_entry_unique'
  ) THEN
    ALTER TABLE public.commissions ADD CONSTRAINT commissions_user_entry_unique UNIQUE (user_id, entry_id);
  END IF;
END $$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_commission_on_status_change ON public.data_entries;
CREATE TRIGGER trg_commission_on_status_change
  AFTER UPDATE ON public.data_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_commission_on_status_change();
