# E-Magang Kota Madiun

Aplikasi manajemen magang berbasis web untuk Pemerintah Kota Madiun: pengajuan, verifikasi, penempatan, presensi harian, sampai penerbitan sertifikat magang di 35 OPD (Organisasi Perangkat Daerah).

## ✨ Fitur Utama

- **Autentikasi berlapis**
  - Mahasiswa: **tanpa password** — email → OTP (kedaluwarsa 5 menit), dengan lockout progresif berbasis deret Fibonacci
  - Admin (Verifikator & OPD): username + password lewat **Laravel Fortify** di `/admin/login`
  - Satu browser tidak boleh memegang dua akun sekaligus (403), dan setiap sesi lain milik user diinvalidasi saat login
- **Alur pengajuan magang** — `pending_verifikator` → `forwarded_opd` → `waiting_tte` → `approved` → `ongoing` → `completion_submitted` → `needs_certificate` → `completed`, dengan `rejected` sebagai cabang akhir. Setiap transisi menulis jejak audit.
- **Alur TTE (tanda tangan elektronik)** — Surat Penerimaan dan Sertifikat **tidak dikirim otomatis**. Sistem mencetak **draf** PDF, dokumen ditandatangani manual di luar sistem, diunggah kembali, **baru** kemudian dikirim ke peserta. Status `waiting_tte` dan `needs_certificate` adalah dua titik tunggu itu.
- **Presensi harian** — satu absen per hari per peserta (hadir/izin/sakit) dengan dokumentasi foto 1–3 gambar; dipantau Admin OPD dan Verifikator.
- **Kelola Surat per OPD** — kop surat, daftar penandatangan, template surat, dan arsip dokumen ber-TTE, plus Surat Penyelesaian Magang ber-kop Kominfo.
- **Kelola OPD, kuota, FAQ, dan Nomor SK** oleh Admin Verifikator — termasuk kelola akun user mahasiswa (aktif/nonaktif, `last_login`) dan kelola sesama admin Verifikator (password auto-generate, reset password).
- **Role-based access control** — tiga role (`mahasiswa`, `admin_opd`, `admin_verifikator`) lewat enum `App\Enums\UserRole` + middleware `EnsureUserRole` (alias route `role:`). **Tidak memakai Spatie Laravel Permission.**
- **Halaman publik** — landing page dengan form pengajuan (dilindungi **reCAPTCHA v2**), lacak status pengajuan via `/lacak`, dan FAQ.

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend Bridge | Inertia.js v3 (tanpa lapisan injeksi REST/JSON) |
| Frontend | React 19 + TypeScript + Tailwind v4 + shadcn/ui |
| Database | PostgreSQL |
| Otorisasi | Enum `UserRole` + middleware `EnsureUserRole` |
| Autentikasi Admin | Laravel Fortify |
| Autentikasi Mahasiswa | OTP via email (implementasi sendiri) |
| PDF Generator | DomPDF |
| Test | Pest v4 (berjalan di PostgreSQL) |

## 📋 Prasyarat

- **PHP >= 8.3** (`composer.json` mensyaratkan `^8.3`)
- Composer
- Node.js >= 20 & npm
- **PostgreSQL >= 14** — plus satu database kedua bernama `magang_test` untuk suite test
- Ekstensi PHP `gd` atau `imagick` **opsional**: tanpanya normalisasi pas foto dan logo pada PDF dilewati, aplikasi tetap jalan

## 🚀 Instalasi

> **`composer setup` sengaja tidak dipakai di sini.** Ikuti langkah manual di bawah.

```bash
git clone <url-repo> magange
cd magange

composer install
npm install

# 1. Environment
cp .env.example .env
php artisan key:generate
#    Sesuaikan DB_* dan MAIL_* di .env.
#    APP_URL WAJIB berskema (http://localhost:8000), bukan "localhost".

# 2. Database aplikasi dan database khusus test
php artisan migrate --seed    # seeder: OPD → admin → FAQ → contoh pengajuan

# 3. Wayfinder — WAJIB sebelum types:check / build
#    Output-nya (resources/js/{actions,routes,wayfinder}) di-ignore git, jadi pada
#    clone baru direktori ini belum ada dan tsc/vite akan gagal.
php artisan wayfinder:generate --with-form

# 4. Aset frontend
npm run build       # atau `npm run dev` (sudah menjalankan wayfinder lebih dulu)

# 5. Symlink storage bila perlu (berkas unggahan ada di disk privat)
php artisan storage:link
```

## ▶️ Menjalankan Aplikasi

```bash
composer dev
```

Menjalankan tiga proses sekaligus: `php artisan serve`, `php artisan queue:listen --queue=emails,default --tries=1`, dan Vite. Aplikasi ada di `http://localhost:8000`.

> **Worker antrean tidak opsional.** Dengan `QUEUE_CONNECTION=database`, seluruh email (konfirmasi pengajuan, penolakan, OTP, surat penerimaan ber-TTE, sertifikat) hanya terkirim bila worker jalan — tanpa worker, job menumpuk di tabel `jobs` tanpa pesan galat apa pun. Dengan `QUEUE_CONNECTION=sync` job jalan inline, tapi kegagalannya muncul sebagai error 500 di layar dan tidak masuk `failed_jobs`.

### SMTP lokal

Cara termudah adalah **Mailpit** (satu binary, tanpa akun):

```bash
mailpit            # SMTP di 127.0.0.1:1025, UI di http://localhost:8025
```

`.env.example` sudah menunjuk ke sana. Alternatif: Mailtrap (produksi memakai `railsware/mailtrap-php`), atau `MAIL_MAILER=log` bila cukup membaca email di `storage/logs/laravel.log`.

## 👤 Akun hasil seeder

| Role | Username | Password | Catatan |
|---|---|---|---|
| Admin Verifikator | `verifikator` | `password` | Login di `/admin/login` |
| Admin OPD | slug kode OPD, mis. `diskominfo`, `bkd`, `bakesbangpol` | `password` | Satu akun per OPD (35 akun) |
| Mahasiswa | — | — | **Tidak bisa login pakai password.** Masuk lewat `/login-otp` dengan email; kode OTP dikirim ke email (lihat Mailpit) |

Seeder juga mengisi **kop surat + satu penandatangan** untuk setiap OPD. Itu bukan hiasan: aksi "ACC" pada pengajuan **ditolak** (422) bila OPD belum punya penandatangan atau kop suratnya belum lengkap, jadi tanpa data ini instalasi baru tidak bisa menyetujui satu pengajuan pun.

## 🧪 Testing

```bash
php artisan test                                  # butuh database `magang_test`
php artisan test --filter=SubmissionServiceTest   # satu file/kasus
```

Suite berjalan di PostgreSQL, bukan SQLite — `phpunit.xml` memasang `DB_DATABASE=magang_test` tanpa fallback. Pastikan database `magang_test` sudah dibuat.

## 🔧 Perintah Harian

| Perintah | Kegunaan |
|---|---|
| `composer dev` | Server + worker antrean + Vite sekaligus |
| `composer ci:check` | Gate penuh: eslint + prettier + tsc + Pint + PHPStan + Pest |
| `composer lint` | Pint (format PHP) |
| `npm run lint` / `npm run format` | eslint --fix / prettier --write |
| `npm run types:check` | `tsc --noEmit` (jalankan Wayfinder lebih dulu) |
| `npm run build` | Build produksi Vite |
| `php artisan wayfinder:generate --with-form` | Regenerasi helper route TypeScript |
| `php artisan migrate --seed` | Migrasi + data awal |
| `php artisan magang:transition-statuses` | Picu manual transisi status harian (cron 01:00 WIB) |
| `php artisan schedule:test --name="magang:transition-statuses"` | Uji jadwal tanpa menunggu cron |
| `php artisan db:seed --class=DemoSpectrumSeeder` | Data demo satu tiket per status (untuk peragaan/demo) |
| `php artisan magang:demo-status {tiket} {status}` | Pindahkan satu tiket ke status demo (hanya non-produksi) |

> `./vendor/bin/phpstan analyse --memory-limit=1G` — PHPStan level 7 butuh memori lebih besar dari default 128M; tanpa flag ini pekerja paralelnya mati dan `composer ci:check` gagal sebelum menyentuh test.

## 🧭 Alur Penggunaan

1. **Pengajuan** — calon peserta mengisi form di halaman depan (terlindung reCAPTCHA) atau login OTP sebagai Mahasiswa lalu mengajukan magang beserta dokumen pendukung.
2. **Verifikasi** — Admin Verifikator menyaring pengajuan masuk dan meneruskan ke OPD tujuan (`pending_verifikator` → `forwarded_opd`), atau menolak dengan alasan.
3. **Penetapan** — Admin OPD memutuskan pengajuan yang masuk ke OPD-nya, mengatur penempatan, lalu menunggu TTE surat penerimaan.
4. **TTE** — Admin OPD mencetak **draf** surat penerimaan PDF, menandatanganinya di luar sistem, mengunggah kembali, dan sistem mengirim surat ber-TTE ke peserta (`waiting_tte` → `approved`).
5. **Pelaksanaan** — Mahasiswa presensi harian (hadir/izin/sakit + foto dokumentasi); Admin OPD memantau; status menjadi `ongoing`.
6. **Penyelesaian** — Mahasiswa mengunggah laporan akhir, Admin OPD meninjaunya, status maju ke `completion_submitted` → `needs_certificate`.
7. **Sertifikat** — Admin OPD mencetak draf sertifikat, mengunggah versi bertanda tangan, sistem mengirimnya ke peserta. Mahasiswa wajib mengisi survei kepuasan sebelum bisa mengunduh e-sertifikat (`completed`).

Setiap perpindahan status dicatat sebagai jejak audit (`ApplicationStatusLog`) dan dikirimkan notifikasi email ke pihak terkait.

## 🗂️ Struktur Role

| Role | Akses |
|---|---|
| Mahasiswa | Login OTP, mengajukan magang, unggah dokumen, presensi harian, laporan akhir, survei kepuasan, unduh sertifikat |
| Admin OPD | Memutuskan pengajuan yang masuk OPD-nya, mengelola penempatan & peserta, alur TTE (surat penerimaan + sertifikat), kelola surat & kuota OPD, tinjau laporan akhir |
| Admin Verifikator | Menyaring pengajuan masuk dan meneruskannya ke OPD, CRUD OPD & FAQ, kelola user mahasiswa & admin OPD, Kelola Nomor SK |

## 🗜️ Struktur Proyek (ringkas)

```text
app/Contracts/       Daftar antarmuka service (kontrak)
app/Models/          Eloquent: User, OPD, InternshipApplication, Presensi*, Certificate, dst.
app/Enums/           UserRole, ApplicationStatus, DocumentType, ReportStatus
app/Services/        Logika bisnis inti: SubmissionService, CertificateService, LetterDocumentService, OtpService, dll.
app/Http/Controllers/ Controller tipis per role (Mahasiswa/Opd/Verifikator + Auth + Shared)
app/Http/Middleware/ EnsureUserRole, EnsureMustChangePassword, SanitizeInput, HandleInertiaRequests
app/Jobs/ + app/Mail/   Email async: OTP, konfirmasi pengajuan, penolakan, surat penerimaan, sertifikat
app/Notifications/    Notifikasi test email
routes/web.php        Rute Inertia per role + aksi domain (state machine) + halaman publik
resources/js/pages/   Halaman Inertia: {mahasiswa,opd,verifikator}/**, auth/, settings/
resources/js/components/ Komponen React bersama (shadcn/ui, layout, wrapper)
tests/                Feature + Unit (Pest) — data seed via factory
```

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan internal Pemerintah Kota Madiun.

