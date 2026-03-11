

## Plan: Tambahkan Role "Owner"

### Konsep
- **Super Admin**: Platform manager — mengatur jenis pembayaran/langganan untuk owner (persertifikat, perbulan, pergroup, dll)
- **Owner**: Pemilik bisnis — mengelola tim (tambah user, ubah role/password), mengatur field access, komisi, dan pengaturan aplikasi (branding)
- Owner ada di bawah super_admin, di atas admin/lapangan/nib/admin_input

### Perubahan Database

**Migration SQL:**
1. Tambah `owner` ke enum `app_role`
2. Tambah `field_access` default untuk role owner (full access semua field)
3. Tambah tabel `platform_billing` untuk super_admin kelola pembayaran owner:
   - `id`, `owner_user_id`, `billing_type` (per_sertifikat, per_bulan, per_group), `amount`, `status`, `notes`, `created_at`, `updated_at`

### Perubahan File

**1. `src/components/AppLayout.tsx`**
- Tambah `owner` di `NAV_ITEMS` dengan menu: Dashboard, Kelola User, Group Halal, Share Link, Komisi, Pengaturan
- Sama seperti super_admin tapi tanpa menu billing platform

**2. `src/App.tsx`**
- Route `/users`: allowedRoles tambah `"owner"`
- Route `/settings`: allowedRoles tambah `"owner"`
- Di semua tempat yang cek `super_admin`, tambah `owner` jika relevan

**3. `src/pages/UsersManagement.tsx`**
- Owner bisa buat user dengan role: admin, admin_input, lapangan, nib, umkm (tidak bisa buat super_admin atau owner)
- Owner bisa hapus user (kecuali super_admin dan owner lain)
- Tambah fitur "Ubah Password" dan "Ubah Role" per user

**4. `src/pages/AppSettings.tsx`**
- Jika role = owner: tampilkan tab Branding, Hak Akses Field, Komisi, Siap Input
- Jika role = super_admin: tampilkan tab Billing Platform (baru) — kelola jenis pembayaran per owner
- Tambah tab "Billing Platform" untuk super_admin: tabel owner + jenis langganan + tarif

**5. `src/pages/GroupDetail.tsx`**
- Semua cek `role === "super_admin"` ditambah `|| role === "owner"` untuk:
  - Lihat semua data (bukan hanya created_by sendiri)
  - Tab Anggota dan Audit Log
  - Tambah/hapus anggota group
  - Link UMKM

**6. `src/pages/Groups.tsx`**
- Owner bisa buat dan hapus group (sama seperti super_admin)

**7. `src/pages/Dashboard.tsx`**
- Owner melihat semua data (sama seperti super_admin)

**8. `src/pages/Komisi.tsx`**
- Owner bisa kelola komisi (cairkan, lihat semua)

**9. Edge Functions**
- `create-user/index.ts`: Izinkan caller dengan role `owner` (tapi owner tidak bisa buat super_admin/owner)
- `delete-user/index.ts`: Izinkan caller dengan role `owner` (tapi tidak bisa hapus super_admin/owner)

**10. RLS Policies**
- Tambah policy untuk owner di tabel yang relevan (data_entries, groups, group_members, commissions, dll) — mirip super_admin

### Ringkasan Hak Akses

```text
Super Admin:  Platform billing, semua akses owner
Owner:        Kelola user/tim, group, field access, komisi, branding
Admin:        Lihat group, data, komisi sendiri
Admin Input:  Input data di group yang di-assign
Lapangan:     Input data, share link, komisi sendiri
NIB:          Update NIB, komisi sendiri
UMKM:         Lihat status sendiri
```

