## Plan: Perbaiki UX Form & Komisi per Role

### Ringkasan

1. **Sederhanakan DataEntryForm** — hapus dropdown "Hubungkan ke Akun UMKM" dari form utama. Pindahkan ke dialog terpisah di tabel entri (tombol kecil "Link UMKM") agar tidak membingungkan admin saat input data sehari-hari.
2. **Komisi otomatis per aksi role** — modifikasi trigger database agar komisi dibuat bukan hanya saat INSERT, tapi juga saat role tertentu mengubah status (misal: role `nib` mengupload nib`` → dapat komisi sesuai tarif role `nib`).  
komisi admin role input, saat status di ubah ke pengajuan oleh role tersebut dan juga di setujui oleh super admin  
komisi admin lapangan otomatis terupdate saat nib terbit dan juga status sudah pengajuan

---

### 1. DataEntryForm — Hapus Dropdown UMKM

**File: `src/components/DataEntryForm.tsx**`

- Hapus state `umkmUserId`, `umkmUsers`, dan useEffect fetch UMKM users
- Hapus dropdown "Hubungkan ke Akun UMKM" dari JSX
- Hapus logic `umkm_user_id` dari `handleSave` payload

### 2. Link UMKM dari Tabel Entri (Opsional)

**File: `src/pages/GroupDetail.tsx**`

- Tambahkan tombol kecil/icon di baris tabel entri (hanya visible untuk super_admin/admin) untuk membuka dialog kecil "Hubungkan ke UMKM"
- Dialog berisi dropdown pilih akun UMKM + tombol simpan
- Ini memisahkan proses input data dari proses linking akun

### 3. Komisi Otomatis saat Status Berubah (Database Trigger)

**Migration SQL baru** — modifikasi/buat trigger `auto_create_commission_on_status_change`:

```text
Logika:
- Saat status entry berubah (UPDATE), cek siapa yang mengubah (auth.uid())
- Ambil role user tersebut
- Ambil tarif komisi untuk role tersebut dari commission_rates
- Jika tarif > 0 dan belum ada komisi untuk user+entry ini, buat record komisi baru
- Ini berarti:
  - Lapangan dapat komisi saat membuat data baru (trigger INSERT sudah ada)
  - NIB dapat komisi saat mengubah status (misal ke ktp_terdaftar_nib)
  - Admin Input dapat komisi saat mengubah status (misal ke nib_selesai)
```

Trigger akan memastikan **satu user hanya dapat satu komisi per entry** (cek duplikat `user_id + entry_id`).

### 4. Tidak Ada Perubahan di AppSettings

Tab Komisi di pengaturan sudah mendukung setting tarif per role. Tidak perlu perubahan.

---

### Detail Teknis

**Trigger SQL baru (`auto_create_commission_on_status_change`)**:

- Event: `AFTER UPDATE ON data_entries`
- Condition: `OLD.status IS DISTINCT FROM NEW.status`
- Logic: get `auth.uid()` → get role → get rate → insert commission if rate > 0 and no duplicate

**Perubahan file**:

1. `src/components/DataEntryForm.tsx` — hapus bagian UMKM (lines 90-91, 96-111, 337-354, 199-200)
2. `src/pages/GroupDetail.tsx` — tambah dialog link UMKM di tabel
3. Migration SQL — trigger komisi on status change