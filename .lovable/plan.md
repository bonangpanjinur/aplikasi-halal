

## Analisis Lengkap: Bug, Perbaikan UX, dan Kebutuhan Fitur

### A. Bug dan Masalah yang Ditemukan

#### 1. DataEntryForm - `useState` digunakan salah untuk side-effect (line 115-127)
`useState(() => { ... })` digunakan untuk fetch data existing photos. Ini harusnya `useEffect`. Ini bisa menyebabkan foto tidak dimuat ulang saat entry berubah.

#### 2. GroupDetail - Realtime UPDATE tidak difilter per user
Pada realtime subscription, event UPDATE dan DELETE tidak difilter berdasarkan `created_by` untuk non-super_admin. Jika user lain mengupdate entry di group yang sama, entry tersebut bisa muncul tiba-tiba di state user lain.

#### 3. Dashboard - Chart hanya ditampilkan untuk super_admin/admin
Line 296: `(role === "super_admin" || role === "admin")` menyembunyikan chart untuk role `lapangan`, `nib`, `admin_input`. Padahal mereka bisa melihat ringkasan data mereka sendiri dalam bentuk chart.

#### 4. AppLayout - Sidebar menampilkan "HalalTrack" hardcoded
Meskipun ada setting `app_name` di AppSettings, sidebar masih menampilkan "HalalTrack" hardcoded (line 103, 164). Seharusnya fetch dari `app_settings`.

#### 5. AppSettings - Simpan commission_rates menggunakan UPDATE tanpa INSERT
Jika role belum ada di tabel `commission_rates`, UPDATE tidak akan melakukan apa-apa. Seharusnya gunakan UPSERT.

#### 6. AppSettings - Simpan field_access juga hanya UPDATE
Sama seperti commission_rates, jika row belum ada di `field_access`, UPDATE tidak menyimpan perubahan baru.

#### 7. Komisi - Admin bisa "Cairkan" tapi tidak ada konfirmasi
Tombol "Cairkan Semua Pending" langsung mengeksekusi tanpa dialog konfirmasi. Ini berbahaya karena bisa mengubah banyak data sekaligus.

#### 8. UsersManagement - Hapus user tanpa konfirmasi
Tombol delete langsung memanggil `handleDelete` tanpa dialog konfirmasi.

---

### B. Perbaikan UX yang Dibutuhkan

#### 1. Dashboard per Role lebih informatif
- **Lapangan**: Tampilkan jumlah data yang di-input hari ini, minggu ini, bulan ini. Tampilkan progress bar target (jika ada).
- **NIB**: Tampilkan antrian data yang perlu di-proses NIB-nya (status `siap_input`).
- **Admin Input**: Tampilkan data yang perlu di-input (status `siap_input`).
- Semua role: Tampilkan chart status masing-masing, bukan hanya super_admin/admin.

#### 2. GroupDetail - Tampilan tabel tidak responsive
Tabel entri bisa sangat lebar di mobile. Perlu scroll horizontal yang lebih jelas atau card view untuk mobile.

#### 3. ShareLinks - Tidak ada statistik per link
Admin/lapangan tidak tahu berapa banyak data yang masuk dari setiap share link. Perlu counter "X data masuk via link ini".

#### 4. Profile - Tidak menampilkan role user
Halaman profile tidak menunjukkan role user saat ini.

#### 5. Public Form - Tidak ada loading state saat submit
Form publik tidak menampilkan loading indicator saat data sedang dikirim.

---

### C. Fitur yang Dibutuhkan

#### Untuk Admin (super_admin/admin)

1. **Dashboard ringkasan kinerja per admin**
   - Super admin bisa melihat berapa banyak data yang diinput oleh masing-masing admin lapangan dalam periode tertentu.
   - Ranking/leaderboard admin berdasarkan jumlah input.

2. **Notifikasi untuk admin**
   - Saat data baru masuk via share link, admin yang membuat link mendapat notifikasi.
   - Saat status berubah, admin terkait mendapat notifikasi.

3. **Bulk edit/delete entries**
   - Bulk delete sudah bisa di-support tapi belum ada tombolnya.
   - Bulk assign PIC ke entry tertentu.

4. **Export data lebih lengkap**
   - Export dengan foto (ZIP) sudah ada, tapi export CSV belum menyertakan tracking code dan nama PIC.

5. **Statistik share link**
   - Jumlah klik dan data yang masuk per share link.

6. **Log aktivitas global**
   - Super admin bisa melihat semua audit log lintas group, bukan hanya per group.

#### Untuk UMKM

1. **Progress timeline/tracker visual**
   - Tampilkan timeline visual dari proses sertifikasi (belum lengkap → siap input → ... → sertifikat selesai), bukan hanya badge status.

2. **Download dokumen sendiri**
   - UMKM bisa download NIB dan sertifikat halal mereka langsung dari dashboard.

3. **Hubungi petugas**
   - Tombol WhatsApp/kontak langsung ke petugas lapangan yang menangani data mereka.

4. **Riwayat perubahan status**
   - UMKM bisa melihat kapan status mereka berubah dan oleh siapa.

---

### D. Prioritas Implementasi yang Disarankan

| Prioritas | Item | Kategori |
|-----------|------|----------|
| Tinggi | Fix useState → useEffect di DataEntryForm | Bug |
| Tinggi | Fix realtime filter di GroupDetail | Bug |
| Tinggi | Konfirmasi sebelum cairkan komisi & hapus user | UX |
| Tinggi | Fetch app_name & logo di sidebar | Bug |
| Sedang | Chart untuk semua role di Dashboard | UX |
| Sedang | Upsert untuk commission_rates & field_access | Bug |
| Sedang | Progress timeline untuk UMKM | Fitur |
| Sedang | Statistik per share link | Fitur |
| Sedang | Dashboard kinerja admin untuk super_admin | Fitur |
| Rendah | Notifikasi admin | Fitur |
| Rendah | Export CSV lebih lengkap | Fitur |
| Rendah | Kontak petugas untuk UMKM | Fitur |

