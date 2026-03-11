

## Analisis Bug dan Perbaikan

### Bug yang Ditemukan

**1. Profiles kosong — trigger `handle_new_user` tidak ada**
Fungsi `handle_new_user()` ada di database tapi trigger-nya di `auth.users` tidak pernah dibuat. Akibatnya saat user dibuat via `create-user` edge function, profil tidak otomatis terisi. Ini sebab "Kelola User" menampilkan list kosong — `profiles` table empty.

**Fix**: Buat trigger `on_auth_user_created` di `auth.users` + insert profiles untuk user yang sudah ada.

**2. Hak Akses (Field Access) & Komisi masih tampil di super_admin**
Di `AppSettings.tsx`, tab "Hak Akses", "Siap Input", dan "Komisi" tampil untuk super_admin dan owner. Seharusnya hanya owner yang kelola ini. Super admin hanya kelola Billing Platform.

**Fix**: Sembunyikan tab Hak Akses, Siap Input, Komisi untuk super_admin. Sembunyikan tab Billing untuk owner.

**3. Platform Billing belum mendukung Trial**
Belum ada fitur trial (misal 1 minggu gratis). Perlu tambah kolom `trial_days` (dinamis) dan `trial_start` ke `platform_billing`.

**Fix**: Tambah kolom `trial_days` (integer, default 7) dan `trial_start` (timestamp) ke `platform_billing`. Tampilkan info trial di billing tab.

**4. Console warning: Select ref di AppSettings**
`<Select>` component diberikan ref langsung. Minor warning tapi perlu dibersihkan.

### Perubahan

**Database Migration:**
```sql
-- 1. Buat trigger handle_new_user di auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Insert profiles untuk user yang sudah ada
INSERT INTO public.profiles (id, full_name, email)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Tambah kolom trial di platform_billing
ALTER TABLE public.platform_billing 
  ADD COLUMN trial_days integer NOT NULL DEFAULT 7,
  ADD COLUMN trial_start timestamp with time zone DEFAULT now();
```

**`src/pages/AppSettings.tsx`:**
- Tab "Hak Akses", "Siap Input", "Komisi" hanya tampil jika `isOwner`
- Tab "Billing Platform" hanya tampil jika `isSuperAdmin`
- Tab "Tampilan" tampil untuk keduanya
- Default tab: `isSuperAdmin ? "billing" : "tampilan"` (sudah benar)
- Tambah kolom Trial Days dan Trial Start di form billing super_admin
- Tambah info sisa trial di tabel billing

**`src/pages/UsersManagement.tsx`:**
- Tidak ada bug logika di file ini, masalah ada di profiles kosong (trigger fix)

### Ringkasan Tab per Role

```text
Super Admin:  Billing Platform, Tampilan
Owner:        Tampilan, Hak Akses, Siap Input, Komisi
```

