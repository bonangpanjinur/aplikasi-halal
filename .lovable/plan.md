

## Analisis Bug dan Rencana Perbaikan

Setelah memeriksa seluruh codebase, berikut bug yang ditemukan dan rencana perbaikannya:

### Bug yang Ditemukan

**1. Console Error: Select ref warning di UsersManagement**
- Dialog "Ubah User" menggunakan `<Select>` tanpa `DialogDescription`, menyebabkan warning `Missing Description or aria-describedby`. Juga ada warning ref pada Select component.
- **Fix**: Tambahkan `DialogDescription` di kedua Dialog.

**2. Register.tsx: `.single()` pada referral code lookup bisa error**
- Jika referral code tidak ditemukan, `.single()` throw error alih-alih return null.
- **Fix**: Ganti `.single()` dengan `.maybeSingle()`.

**3. Data sensitif `kata_sandi` terekspos di public RLS policy**
- Tabel `data_entries` punya policy "Public can view entries by tracking code" yang memperbolehkan siapa saja melihat SEMUA kolom termasuk `kata_sandi` selama `tracking_code IS NOT NULL`. Ini sangat berbahaya.
- **Fix**: Kolom `kata_sandi` seharusnya tidak terlihat di halaman tracking publik. Tracking view (`tracking_view`) sudah membatasi kolom, tapi policy pada `data_entries` langsung masih terlalu permisif. Perlu audit apakah tracking page mengakses `data_entries` langsung atau via view.

**4. GroupDetail.tsx: Tabel menampilkan kata_sandi tanpa field access check**
- Kolom email dan kata_sandi ditampilkan hardcoded tanpa mengecek `canView` dari field access.
- **Fix**: Perlu filter kolom berdasarkan field access permission.

**5. DataEntryForm: `(entry as any)?.email` dan `(entry as any)?.kata_sandi` - type casting**
- Fields email dan kata_sandi di-cast sebagai `any` karena types belum terupdate. Ini bukan bug kritis tapi bisa menyebabkan silent failures.
- **Fix**: Kolom sudah ada di database. Types file auto-generated, jadi ini akan terselesaikan saat types direfresh. Sementara cast `as any` acceptable.

**6. AppSettings: RLS policy `field_access` - super_admin missing WITH CHECK**
- Policy "Super admin can manage field access" menggunakan `ALL` tapi tidak memiliki `WITH CHECK` expression, sehingga insert/update bisa silently fail.
- **Fix**: Tambahkan WITH CHECK expression.

**7. Dashboard: `platform_billing` query menggunakan `as any` cast**
- `supabase.from("platform_billing" as any)` menandakan tabel ini belum ada di types. Query bisa gagal silently.
- Ini karena types belum di-sync. Bukan bug kritis.

**8. Register: Auto-confirm mungkin tidak aktif**
- User register UMKM langsung navigate ke `/umkm` tanpa verifikasi email. Jika auto-confirm tidak aktif, user tidak bisa login.
- Perlu cek: apakah ini by design atau bug.

### Rencana Implementasi

#### Task 1: Fix UsersManagement Dialog warnings
- Tambahkan `DialogDescription` ke kedua Dialog (create & edit user)

#### Task 2: Fix Register referral code lookup
- Ganti `.single()` dengan `.maybeSingle()` pada query referral code

#### Task 3: Fix GroupDetail - field access check untuk kolom email/kata_sandi
- Wrap kolom email dan kata_sandi dengan `canView()` check di tabel dan CSV export

#### Task 4: Perkuat keamanan tracking - batasi kolom yang bisa diakses publik
- Pastikan halaman tracking menggunakan `tracking_view` (yang sudah membatasi kolom), bukan query langsung ke `data_entries`

#### Task 5: Fix super_admin field_access RLS policy
- Tambahkan WITH CHECK expression pada policy "Super admin can manage field access"

### Detail Teknis

**Files yang akan diubah:**
- `src/pages/UsersManagement.tsx` - Tambah DialogDescription
- `src/pages/Register.tsx` - `.single()` → `.maybeSingle()`
- `src/pages/GroupDetail.tsx` - Field access check untuk email/kata_sandi
- `src/pages/Dashboard.tsx` - Field access check untuk kata_sandi di recent entries
- Database migration - Fix RLS policy super_admin field_access WITH CHECK

