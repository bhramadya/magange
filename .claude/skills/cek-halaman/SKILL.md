---
name: cek-halaman
description: "Verifikasi sebuah halaman role benar-benar ter-render di browser (bukan layar putih), memakai Playwright MCP + akun seeder. Pakai setelah menambah/mengubah halaman Inertia di resources/js/pages/{mahasiswa,verifikator,opd}/**, setelah mengubah props di controller, atau saat user melaporkan 'halaman kosong', 'putih', 'blank', 'tidak muncul apa-apa' padahal tidak ada error di log Laravel. Kata kunci: layar putih, blank screen, halaman kosong, cek render, screenshot halaman, verifikasi UI, props tidak sampai."
---

# Cek halaman render (anti layar putih)

## Kenapa skill ini ada

Repo ini punya mode gagal yang **tidak terlihat di test maupun log Laravel**:
setiap halaman yang membungkus dirinya dengan `MagangLayout` membaca
`user.role`/`user.name` tanpa fallback ke shared prop `auth.user`. Kalau
controller lupa mengirim `'user' => new MagangUserResource($request->user())`,
server tetap balas **HTTP 200**, tapi React throw saat render dan meng-unmount
seluruh tree → **layar putih kosong, log Laravel bersih**. Kasus nyata:
`/opd/surat` (diperbaiki 2026-07-30).

`php artisan test` tidak menangkap ini karena ia hanya memeriksa respons
Inertia, bukan hasil render React. Satu-satunya bukti ada di console browser.

## Prasyarat

1. Server + Vite hidup: `composer dev` (serve + queue + vite). Tanpa Vite,
   halaman gagal karena alasan lain (manifest), bukan bug yang dicari.
2. DB sudah di-seed: `php artisan migrate:fresh --seed` bila belum.
3. Akun dari seeder (semuanya `must_change_password = false`, jadi login
   langsung masuk dasbor — bukan dialihkan ke `admin/password-baru`):
   - Verifikator → username `verifikator`, password `password`
   - Admin OPD → username = slug `opds.code`, mis. `bakesbangpol`,
     password `password` (ada 35 akun OPD dari seeder)
   - Mahasiswa → **tidak bisa dipakai di skill ini**: loginnya email+OTP
     dan OTP dikirim via email. Untuk halaman mahasiswa, ambil OTP dari
     Mailtrap/log mail dulu, atau uji lewat Pest saja.

## Prosedur

1. Login lewat Playwright MCP: buka `/admin/login` (ini Fortify, bukan
   controller sendiri), isi **`username`** + password, submit.
   Catat: reCAPTCHA v3 dilewati total kalau `RECAPTCHA_SECRET_KEY` kosong —
   jadi di dev tanpa key, form ini lolos tanpa captcha.
2. Navigasi ke halaman target (mis. `/opd/surat`, `/opd/menunggu-tte`,
   `/verifikator/masuk`).
3. **Baca console browser** — ini inti pemeriksaannya. Ambil pesan console
   lewat Playwright MCP; boleh juga silang-cek dengan tool Boost
   `browser-logs`. `TypeError: Cannot read properties of undefined (reading
   'role')` (atau `'name'`) = prop `user` tidak dikirim controller.
4. Screenshot untuk bukti visual bahwa shell (sidebar biru #106feb + header)
   benar-benar tampil, bukan `<body>` kosong.
5. Ulangi untuk **setiap role** yang boleh membuka halaman itu. Halaman OPD
   dijaga `role:admin_opd`; membukanya sebagai verifikator harus 403, bukan
   layar putih.

## Kalau ketemu layar putih

- Cek controller halaman itu: apakah props-nya menyertakan `user`?
- Perbaiki, lalu **tambahkan asersi `has('user.name')`** di test halaman
  tersebut (lihat pola di `tests/Feature/Feature/Opd/TteFlowTest.php`) supaya
  regresi yang sama ketangkap tanpa browser.
- Jangan "perbaiki" dengan menambah fallback ke `auth.user` di MagangLayout —
  kontrak repo ini adalah controller wajib mengirim `user`.
