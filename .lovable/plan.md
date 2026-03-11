

## Rencana Perbaikan

Berdasarkan analisis plan.md dan kode saat ini, berikut status terkini dan perbaikan yang masih diperlukan:

### Status Bug dari Plan (Sudah Diperbaiki)

Item berikut **sudah tidak perlu diperbaiki**:
- Bug #1: `useState` → `useEffect` di DataEntryForm — sudah `useEffect`
- Bug #5: commission_rates sudah pakai `upsert`
- Bug #6: field_access sudah pakai `upsert`
- Bug #7: Komisi "Cairkan" sudah punya AlertDialog konfirmasi
- Bug #8: UsersManagement delete sudah punya AlertDialog konfirmasi
- Bug #4: AppLayout sudah fetch `app_name` dari `app_settings`

### Masalah Kritis yang Masih Ada

**1. Semua RLS Policy di Seluruh Tabel Masih RESTRICTIVE**

Ini adalah masalah **paling kritis**. Tabel-tabel berikut memiliki SEMUA policy bertipe RESTRICTIVE (Permissive: No). Di PostgreSQL, data hanya bisa diakses jika ada minimal 1 policy PERMISSIVE. Jika semua RESTRICTIVE, tidak ada data yang bisa diakses.

Tabel yang terdampak:
- `app_settings` — semua 3 policy RESTRICTIVE
- `audit_logs` — semua 4 policy RESTRICTIVE
- `commission_rates` — semua 3 policy RESTRICTIVE
- `commissions` — semua 9 policy RESTRICTIVE
- `data_entries` — semua 10 policy RESTRICTIVE
- `disbursements` — semua 4 policy RESTRICTIVE
- `entry_photos` — semua 7 policy RESTRICTIVE
- `field_access` — semua 4 policy RESTRICTIVE
- `group_members` — semua 4 policy RESTRICTIVE
- `groups` — semua 4 policy RESTRICTIVE
- `notifications` — semua 3 policy RESTRICTIVE
- `platform_billing` — semua 2 policy RESTRICTIVE
- `shared_links` — semua 6 policy RESTRICTIVE

**Solusi**: Satu migration besar yang drop semua policy RESTRICTIVE dan recreate sebagai PERMISSIVE, mempertahankan logic USING/WITH CHECK yang sama.

**2. GroupDetail — Realtime tidak difilter per user (Bug #2)**

Realtime subscription tidak memfilter `created_by` untuk non-admin roles. Perlu ditambahkan filter agar user non-admin hanya menerima event untuk entry miliknya sendiri.

**3. Dashboard — Chart tersembunyi untuk role selain admin (Bug #3)**

Statistik chart hanya ditampilkan untuk `super_admin`/`owner`. Role `lapangan`, `nib`, `admin_input` juga seharusnya bisa melihat chart data mereka sendiri.

### Rencana Implementasi

**Step 1: Migration — Fix semua RLS policy (KRITIS)**
- Satu file SQL migration
- Drop + recreate semua policy di 13 tabel sebagai PERMISSIVE
- Tidak mengubah logic akses, hanya mengubah tipe dari RESTRICTIVE ke PERMISSIVE

**Step 2: GroupDetail — Filter realtime per user**
- Di `src/pages/GroupDetail.tsx`, tambahkan filter `created_by` pada realtime subscription callback untuk non-admin/owner

**Step 3: Dashboard — Tampilkan chart untuk semua role**
- Di `src/pages/Dashboard.tsx`, hapus kondisi role pada bagian chart sehingga semua role bisa melihat ringkasan data mereka

### Prioritas
1. **Step 1** harus dilakukan pertama karena tanpa ini, hampir semua query dari client akan mengembalikan data kosong
2. Step 2 dan 3 bisa dilakukan bersamaan setelah Step 1

