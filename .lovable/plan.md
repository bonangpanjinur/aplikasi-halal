

## Rencana Perbaikan & Fitur Baru

Berdasarkan analisis mendalam terhadap kode, berikut rencana implementasi lengkap:

---

### 1. Database Migration — Field Baru & Status Revisi

**Kolom baru di `data_entries`:**
- `email_halal` (text, nullable) — Email akun halal
- `sandi_halal` (text, nullable) — Sandi akun halal
- `email_nib` (text, nullable) — Email akun NIB
- `sandi_nib` (text, nullable) — Sandi akun NIB

**Status baru:**
- Tambahkan `revisi` ke enum `entry_status`

**SQL Migration:**
```sql
ALTER TYPE public.entry_status ADD VALUE 'revisi';
ALTER TABLE public.data_entries ADD COLUMN email_halal text;
ALTER TABLE public.data_entries ADD COLUMN sandi_halal text;
ALTER TABLE public.data_entries ADD COLUMN email_nib text;
ALTER TABLE public.data_entries ADD COLUMN sandi_nib text;
```

---

### 2. Update Field Access System

**File: `src/pages/AppSettings.tsx`**

Tambahkan field baru ke array `FIELDS`:
```
{ key: "email_halal", label: "Email Halal" }
{ key: "sandi_halal", label: "Sandi Halal" }
{ key: "email_nib", label: "Email NIB" }
{ key: "sandi_nib", label: "Sandi NIB" }
```

Ini otomatis membuat field-field tersebut bisa diatur hak aksesnya (view/edit) per role dari tab Hak Akses.

---

### 3. Update DataEntryForm

**File: `src/components/DataEntryForm.tsx`**

- Tambahkan state untuk `emailHalal`, `sandiHalal`, `emailNib`, `sandiNib`
- Render input fields berdasarkan `canEditField("email_halal")`, dst.
- Sertakan dalam payload saat save/update
- Update mapping di `FIELD_TO_COLUMN` untuk Dashboard dan GroupDetail

---

### 4. Status Revisi — Hak Akses & Logic

**File: `src/pages/GroupDetail.tsx`**

- Tambahkan `revisi` ke `STATUS_CONFIG` dengan label "Revisi", variant `destructive`, icon `AlertTriangle`
- Update `ROLE_ALLOWED_STATUSES`: hanya `owner` dan `admin` boleh set status `revisi`
  ```
  owner: [...existing, "revisi"]
  admin: [...existing, "revisi"]
  ```
- Role lain (lapangan, nib, admin_input) TIDAK bisa set revisi

**File: `src/pages/Dashboard.tsx`**
- Tambahkan `revisi` ke `STATUS_LABELS`, `STATUS_COLORS`, `STATUS_BG`, `STATUS_TEXT`, `pieChartConfig`

**File: `src/pages/UmkmDashboard.tsx`**
- Tambahkan `revisi` ke status timeline

---

### 5. Group — Hanya Owner yang Buat

**File: `src/pages/Groups.tsx`**

- Sembunyikan tombol "Buat Group" untuk role selain `owner` (dan `super_admin`)
- Saat ini kemungkinan sudah ada kontrol, tapi perlu dipastikan hanya owner/super_admin yang melihat tombol create

---

### 6. Download Data — Owner, Admin, Admin Input

**File: `src/pages/GroupDetail.tsx`**

Update logika `canDownload`:
```typescript
const canDownload = role === "super_admin" || role === "owner" || role === "admin" || role === "admin_input" || canView("download");
```

---

### 7. Navigasi Owner — Ganti Komisi → Tagihan

**File: `src/components/AppLayout.tsx`**

Ubah nav item `owner`:
```typescript
owner: [
  { label: "Dashboard", ... },
  { label: "Kelola User", ... },
  { label: "Group Halal", ... },
  { label: "Share Link", ... },
  { label: "Tagihan", icon: Receipt, path: "/tagihan" },  // Ganti dari Komisi
  { label: "Pengaturan", ... },
],
```

---

### 8. Halaman Tagihan Baru untuk Owner

**File baru: `src/pages/Tagihan.tsx`**

Halaman ini menampilkan:
1. **Tagihan ke Aplikasi** — Data dari `platform_billing` yang terkait owner yang sedang login
   - Tipe billing, jumlah, status, sisa trial
2. **Tagihan ke Role** — Ringkasan komisi yang harus dibayar owner ke user-user yang didaftarkannya
   - Ambil dari tabel `commissions` berdasarkan user yang berada di group milik owner
   - Summary per role: total pending, total paid

**Route:** Tambahkan `/tagihan` di `App.tsx` dengan `allowedRoles={["owner"]}`

---

### 9. Super Admin — Billing Settings

**File: `src/pages/AppSettings.tsx`**

Tab Billing Platform sudah ada, perlu ditambahkan:
- Toggle "Gratis (Trial)" dengan input jumlah hari trial
- Saat billing amount = 0 dan trial_days > 0, tampilkan sebagai "Trial Gratis"
- Kolom ini sudah ada di database (`trial_days`, `trial_start`, `amount`)

---

### 10. UMKM — Hak Akses Diatur Owner

**Sudah bisa dilakukan** via tab Hak Akses di AppSettings (role UMKM sudah ada di `ALL_ROLES`). Tidak perlu perubahan tambahan, cukup pastikan field baru (email_halal, sandi_halal, email_nib, sandi_nib) ikut terdaftar.

---

### Ringkasan File yang Diubah

| File | Perubahan |
|------|-----------|
| `supabase/migrations/<new>.sql` | Tambah kolom + status revisi |
| `src/components/DataEntryForm.tsx` | Field baru email/sandi halal & NIB |
| `src/pages/AppSettings.tsx` | FIELDS array + billing trial toggle |
| `src/pages/GroupDetail.tsx` | Status revisi + download access + field mapping |
| `src/pages/Dashboard.tsx` | Status revisi di chart/labels |
| `src/pages/UmkmDashboard.tsx` | Status revisi di timeline |
| `src/components/AppLayout.tsx` | Nav owner: Komisi → Tagihan |
| `src/pages/Tagihan.tsx` | Halaman tagihan baru |
| `src/App.tsx` | Route /tagihan |
| `src/pages/Groups.tsx` | Restrict create group to owner |

### Ide Tambahan

1. **Catatan revisi**: Saat owner/admin set status "revisi", bisa ditambahkan input alasan revisi yang tersimpan di `audit_logs` (kolom `notes`) agar UMKM tahu apa yang perlu diperbaiki.
2. **Notifikasi revisi**: UMKM otomatis dapat notifikasi saat statusnya berubah ke "revisi" (sudah ter-cover oleh trigger `notify_umkm_on_status_change`, hanya perlu mapping label).

