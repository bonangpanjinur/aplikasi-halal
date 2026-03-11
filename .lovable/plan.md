
Masalah utamanya sudah jelas dari data backend:

1) `user_roles` berisi data user, tapi `profiles` kosong (`0` baris).  
2) Halaman **Kelola User** saat ini membangun daftar dari `profiles` dulu, jadi hasil akhirnya kosong walaupun role ada.  
3) Jalur pembuatan user (edge function) hanya membuat akun + role, belum menjamin `profiles` ikut terisi.  
4) Kebijakan akses `profiles` saat ini terlalu longgar untuk publik (`SELECT true`), ini tidak aman untuk email user.

Rencana perbaikan (step-by-step):

1. Perbaiki data yang sudah terlanjur kosong
- Buat migration untuk backfill `profiles` dari akun auth yang sudah ada (upsert by `id`).
- Pastikan kolom `full_name` dan `email` ikut diisi saat backfill.

2. Cegah bug berulang di jalur create user
- Update `supabase/functions/create-user/index.ts`:
  - Setelah `createUser`, langsung `upsert` ke `profiles` (id, full_name, email).
  - Jika insert role/profile gagal, lakukan rollback (hapus user auth yang baru dibuat) agar data tidak setengah jadi.
- Samakan juga di `supabase/functions/setup-admin/index.ts` agar super admin awal tidak kehilangan profile.

3. Perkuat halaman Kelola User agar tetap tampil walau profile belum sinkron
- Update `src/pages/UsersManagement.tsx`:
  - Merge data berbasis `user_roles` sebagai source utama (bukan `profiles`).
  - Profile dipakai sebagai enrichment (`full_name`, `email`), bukan syarat user muncul.
  - Tambahkan indikator fallback (mis. “Profil belum sinkron”) + handling error query yang jelas.

4. Amankan akses saat backend dipindah/diintegrasikan
- Hardening RLS `profiles`:
  - Hapus policy publik yang membuka semua email.
  - Ganti jadi policy minimal: `authenticated`/role internal yang memang butuh.
- Untuk flow publik yang memang perlu data profile terbatas:
  - Pindahkan ke endpoint server-side aman (mis. validasi referral / nama PIC) yang hanya mengembalikan field minimum.
  - Dengan ini publik tidak bisa lagi enumerate email seluruh user.

5. Validasi end-to-end setelah implementasi
- Login owner/super_admin → buka `/users` → pastikan semua user muncul.
- Buat user baru → langsung muncul di daftar tanpa refresh paksa.
- Uji skenario profile kosong buatan (simulasi) → daftar tetap menampilkan user dari role.
- Uji endpoint publik (register/public form/tracking) tetap jalan setelah RLS diperketat.
- Re-run security scan untuk memastikan kebocoran email publik tertutup.

Detail teknis yang akan diubah:
- `supabase/migrations/<new>.sql`
  - Backfill `profiles` dari auth users
  - Perketat policy `profiles` (hapus public read email)
- `supabase/functions/create-user/index.ts`
- `supabase/functions/setup-admin/index.ts`
- `src/pages/UsersManagement.tsx`
- (Jika dibutuhkan untuk flow publik) tambah endpoint backend aman untuk lookup terbatas profile/referral.

Hasil akhir yang ditargetkan:
- Data user tidak kosong lagi di Kelola User.
- Pembuatan user konsisten (auth + role + profile selalu sinkron).
- Eksposur data sensitif (terutama email publik) tertutup, sehingga lebih aman untuk migrasi/integrasi backend ke depan.
