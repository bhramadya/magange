---
name: halaman-baru
description: "Resep menambah halaman Inertia baru di E-Magang Kota Madiun tanpa kena jebakan repo ini (prop user wajib, layout self-wrap, Wayfinder, letak test). Pakai saat membuat menu/halaman baru untuk role mahasiswa/verifikator/opd, menambah route Inertia baru, atau memindahkan halaman antar role. Kata kunci: halaman baru, menu baru, tambah page, Inertia::render baru, route baru, sidebar baru."
---

# Menambah halaman Inertia baru

Urutan ini bukan gaya-gayaan: tiap langkah menutup satu kegagalan yang pernah
benar-benar terjadi di repo ini.

## 1. Route (routes/web.php)

Masukkan ke **grup role yang sudah ada**, jangan bikin grup baru:
`Route::middleware(['auth', 'role:admin_opd'])`. Nilai `role:` harus cocok
dengan `UserRole->value` (`mahasiswa`, `admin_verifikator`, `admin_opd`) — salah
tulis = 403 dari `EnsureUserRole`. Endpoint OPD **tidak pernah menerima id OPD**;
selalu pakai OPD milik admin yang login.

Baca blok komentar di sekitarnya dulu — routes/web.php mendokumentasikan
alasan tiap grup.

## 2. Controller

Tipis, delegasi ke service di `app/Services/`. Wajib:

```php
return Inertia::render('opd/nama-halaman', [
    'user' => new MagangUserResource($request->user()),  // ← JANGAN LUPA
    // ...props lain
]);
```

**Prop `user` itu wajib** untuk semua halaman yang membungkus `MagangLayout`
sendiri. Lupa = HTTP 200 + layar putih + log Laravel bersih (React throw saat
baca `user.role`, tree ter-unmount). Lihat skill `cek-halaman`.

## 3. Layout (resources/js/app.tsx)

- Halaman di bawah `mahasiswa/`, `verifikator/`, `opd/` → **tidak perlu
  menyentuh app.tsx**: `layout()` sudah `startsWith()` untuk tiga prefix itu dan
  balas `null` supaya halaman membungkus dirinya sendiri.
- Halaman **top-level branded** baru (sekelas `lacak`, `bantuan`, `pengaturan`)
  → harus menambah `case name === 'nama-halaman': return null;` secara eksplisit,
  kalau tidak ia terbungkus `AppLayout` starter-kit dan brand-nya hilang.

## 4. Halaman React

`resources/js/pages/<role>/<nama>.tsx`, impor `MagangLayout` + array nav
role-nya (`mahasiswaNav` / `verifikatorNav` / `opdNav` dari
`@/layouts/magang-layout`). Kalau menu ini muncul di sidebar, tambahkan
entri ke array nav tersebut.

Halaman di repo ini **besar dan self-contained** (welcome.tsx ~2700 baris):
sub-komponen, konstanta filter, dan dialog dideklarasikan inline di atas file
yang sama, bukan dipecah ke `components/`. Ikuti itu; jangan memecah file
sebagai inisiatif sampingan.

## 5. Link & form: Wayfinder, bukan string URL

Impor dari `@/actions/...` (action controller) atau `@/routes/...` (route
bernama). Direktori itu **generated + gitignored** — jangan pernah diedit
tangan. Hook PostToolUse repo ini otomatis menjalankan
`php artisan wayfinder:generate --with-form` setiap routes/*.php diedit, jadi
helper-nya tidak basi; kalau helper belum ada, jalankan manual sekali.

## 6. Test — letaknya spesifik

`tests/Feature/Feature/{Mahasiswa,Verifikator,Opd,Penyelesaian,Security}/`
(**doubly-nested**, bukan `tests/Feature/<Role>/`). Minimal:

- prop lengkap, termasuk **`has('user.name')`** (menangkap regresi layar putih)
- 403 untuk role lain, dan ownership 403 untuk endpoint OPD milik OPD lain

Contoh terdekat: `tests/Feature/Feature/Opd/TteFlowTest.php`. Butuh berkas
gambar? `UploadedFile::fake()->create(..., 'image/jpeg')` — **bukan** `->image()`,
karena PHP di mesin ini tanpa GD (sudah diverifikasi).

## 7. Gate

`composer ci:check` (eslint + prettier + tsc + Pint + PHPStan + Pest).
Baseline sehat: **~202 test, 10 skipped**. Workflow CI hanya jalan di
develop/main/master/workos — di branch feature, gate lokal ini satu-satunya
penjaga.
