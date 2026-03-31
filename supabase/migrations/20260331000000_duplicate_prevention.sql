-- Add unique index to prevent duplicate entries based on name and phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_entries_nama_nomor_hp ON public.data_entries (nama, nomor_hp);
