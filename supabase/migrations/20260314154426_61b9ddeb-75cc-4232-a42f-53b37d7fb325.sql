-- Add revisi to entry_status enum
ALTER TYPE public.entry_status ADD VALUE IF NOT EXISTS 'revisi';

-- Add new credential fields to data_entries
ALTER TABLE public.data_entries ADD COLUMN IF NOT EXISTS email_halal text;
ALTER TABLE public.data_entries ADD COLUMN IF NOT EXISTS sandi_halal text;
ALTER TABLE public.data_entries ADD COLUMN IF NOT EXISTS email_nib text;
ALTER TABLE public.data_entries ADD COLUMN IF NOT EXISTS sandi_nib text;

-- Update the notify trigger to handle revisi status
CREATE OR REPLACE FUNCTION public.notify_umkm_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_label text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.umkm_user_id IS NOT NULL THEN
    CASE NEW.status::text
      WHEN 'belum_lengkap' THEN status_label := 'Belum Lengkap';
      WHEN 'siap_input' THEN status_label := 'Siap Input';
      WHEN 'terverifikasi' THEN status_label := 'Terverifikasi';
      WHEN 'nib_selesai' THEN status_label := 'NIB Selesai';
      WHEN 'pengajuan' THEN status_label := 'Pengajuan';
      WHEN 'sertifikat_selesai' THEN status_label := 'Sertifikat Selesai';
      WHEN 'ktp_terdaftar_nib' THEN status_label := 'KTP Terdaftar NIB';
      WHEN 'ktp_terdaftar_sertifikat' THEN status_label := 'KTP Terdaftar Sertifikat';
      WHEN 'revisi' THEN status_label := 'Revisi';
      ELSE status_label := NEW.status::text;
    END CASE;

    INSERT INTO public.notifications (user_id, entry_id, title, message)
    VALUES (
      NEW.umkm_user_id,
      NEW.id,
      'Status Diperbarui',
      'Status untuk "' || COALESCE(NEW.nama, 'Data UMKM') || '" berubah menjadi ' || status_label
    );
  END IF;
  RETURN NEW;
END;
$$;