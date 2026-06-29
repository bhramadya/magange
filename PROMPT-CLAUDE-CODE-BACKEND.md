# Prompt untuk Claude Code — Pengerjaan Backend E-Magang

> Salin blok di bawah ini, tempel sebagai pesan pertama ke Claude Code di repo `magange`. Sudah ditulis agar Claude langsung paham konteks, batasan, dan urutan kerja. Kerjakan **bertahap** — jangan minta Claude menyelesaikan semua sekaligus.

---

## 📋 Prompt utama (copy mulai dari sini)

```
Kamu mengerjakan BACKEND untuk "E-Magang Kota Madiun" — portal pendaftaran magang
Pemkot Madiun. Stack: Laravel 13 (PHP 8.3+) + Inertia v3 + React 19 + TypeScript +
PostgreSQL. Bahasa domain & UI: Indonesia.

KONTEKS PENTING:
- Frontend SUDAH SELESAI 100%. Semua halaman React/Inertia render mandiri pakai
  MOCK data sebagai default props. Tugasku HANYA backend: ganti mock dengan data
  asli TANPA mengubah path route & nama prop, lalu pasang auth + role middleware.
- Baca dulu, sebelum menyentuh kode: HANDOFF-BACKEND.md (peta route, kontrak props,
  daftar endpoint), lalu CLAUDE.md dan AGENTS.md (konvensi wajib). Tipe domain ada
  di resources/js/types/magang.ts — itu kontrak bentuk data yang TIDAK boleh berubah.

ATURAN KERAS:
1. Inertia, BUKAN REST API. Controller mengembalikan Inertia::render('nama-page', [...props]).
2. JANGAN ubah path route di routes/web.php. Cukup ganti Route::inertia(...) menjadi
   controller + Inertia::render(...). href frontend sudah final.
3. Nama & bentuk prop harus sama persis dengan yang dipakai komponen (lihat
   HANDOFF-BACKEND.md §4). Ikuti tipe di resources/js/types/magang.ts.
4. Tree AKTIF adalah resources/js/ (subfolder kapital Pages/, Layouts/). Folder
   "Resources/" huruf-R-besar adalah shadow tree yang TIDAK dipakai Vite — abaikan.
5. JANGAN validasi pakai `npm run types:check` (ada ~106 error casing pre-existing).
   Verifikasi pakai: composer test, php artisan test, php artisan route:list, npm run build.
6. Login pakai OTP via email (BUKAN password Fortify). Tidak ada registrasi/reset.
   Hash OTP disimpan di kolom users.password, verifikasi via Auth::attempt(email, otp).
7. Format PHP dengan `vendor/bin/pint --dirty` & jalankan `phpstan analyse` sebelum selesai.

CARA KERJA:
- Sebelum mulai, buat ringkasan rencana bertahap & tunggu konfirmasiku.
- Kerjakan SATU fase per waktu. Setelah tiap fase: jalankan test + pint + phpstan,
  laporkan hasil, baru lanjut.
- Cari komentar "TODO(backend)" di resources/js untuk tahu payload tiap endpoint.
- Jika ragu soal bentuk data, BERHENTI dan tanya — jangan menebak skema.

FASE PENGERJAAN (urutan disarankan):
  Fase 1 — Auth OTP: nonaktifkan registrasi/reset Fortify, buat OtpLoginController
           (request + verify), middleware EnsureUserRole, redirect per role.
  Fase 2 — Form pendaftaran publik: PengajuanController@store dari form welcome (#daftar),
           buat InternshipApplication status pending_verifikator + email tiket,
           captcha + rate limit (tabel form_rate_limits). Lalu LacakController (?tiket=).
  Fase 3 — Dasbor Mahasiswa: dashboard, pengajuan, penyelesaian (laporan/survei/sertifikat).
  Fase 4 — Verifikator: dashboard, masuk, riwayat + aksi teruskan/tolak.
  Fase 5 — OPD: dashboard, keputusan, peserta + aksi setujui/tolak (scope OPD login).
  Fase 6 — Bantuan & Pengaturan (props {user}; pengaturan: PATCH profil/notifikasi).

Mulai dengan membaca HANDOFF-BACKEND.md, CLAUDE.md, AGENTS.md, dan
resources/js/types/magang.ts, lalu paparkan rencana Fase 1 secara detail. Tunggu
persetujuanku sebelum menulis kode.
```

---

## 💡 Tips memakai prompt ini

- **Jangan kirim semua fase sekaligus.** Setelah Claude selesai Fase 1, baru bilang
  "lanjut Fase 2", dst. Backend yang ditulis sekaligus tanpa diuji bertahap rawan bug.
- Saat Claude minta keputusan skema, jawab merujuk `resources/js/types/magang.ts`.
- Untuk tiap endpoint, minta Claude membuat **FormRequest** (validasi) + **test Pest**.
- Jika ada model/migration yang belum ada, minta Claude cek dulu `app/Models`,
  `database/migrations`, dan seeder yang sudah ada sebelum membuat baru.
- Setelah semua fase, minta Claude menghapus blok "PRATINJAU FRONTEND (SEMENTARA)"
  di `routes/web.php` dan menghapus mock default di komponen yang sudah dapat props asli.

## ✅ Checklist akhir untuk rekanmu
- [ ] `php artisan route:list` — semua path SAMA seperti sebelumnya (tidak ada yang berubah)
- [ ] `composer test` hijau (pint + phpstan + test)
- [ ] `npm run build` sukses
- [ ] Login OTP jalan untuk 3 role + redirect benar
- [ ] Form `#daftar` membuat pengajuan + email tiket terkirim
- [ ] Alur status penuh teruji: pending → forwarded → approved → ongoing → completed
- [ ] Blok pratinjau di `routes/web.php` dihapus & rute dasbor dibungkus auth+role
