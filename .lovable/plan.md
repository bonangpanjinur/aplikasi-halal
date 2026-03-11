

## Plan: Bedakan Menu Super Admin dan Owner

### Masalah
Menu navigasi `super_admin` dan `owner` di `AppLayout.tsx` saat ini identik — keduanya punya Dashboard, Kelola User, Group Halal, Share Link, Komisi, Pengaturan.

### Konsep
- **Super Admin** = platform manager → tidak perlu Group Halal, Share Link, Komisi (itu urusan owner)
- **Owner** = pemilik bisnis → tidak perlu menu platform-level

### Perubahan di `src/components/AppLayout.tsx`

```text
Super Admin:
  - Dashboard (ringkasan platform)
  - Kelola Owner (halaman users, tapi fokus owner)
  - Pengaturan (billing platform)

Owner:
  - Dashboard
  - Kelola User (tim mereka)
  - Group Halal
  - Share Link
  - Komisi
  - Pengaturan (branding, field access, komisi rate)
```

Hanya perubahan di `NAV_ITEMS.super_admin` — hapus Group Halal, Share Link, Komisi. Ganti label "Kelola User" jadi "Kelola Owner". Owner tetap seperti sekarang.

