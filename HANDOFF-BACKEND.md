# Catatan Serah Terima ke Backend — E-Magang Kota Madiun

> Frontend **selesai 100%**. Semua halaman dibuat sebagai komponen Inertia yang render mandiri memakai **mock data** sebagai nilai default props. Tugas backend: mengganti mock dengan data asli **tanpa mengubah path & nama prop**, lalu memasang auth + role middleware.

---

## 1. Aturan main (jangan dilanggar)

1. **Inertia, bukan REST API.** Tidak ada layer JSON/API. Controller mengembalikan `Inertia::render('nama-page', [...props])`. Server & client terkopel lewat Inertia.
2. **Jangan ubah path route.** Semua `href` di frontend sudah menunjuk path final (lihat tabel §3). Cukup ganti `Route::inertia(...)` menjadi controller + `Inertia::render(...)`.
3. **Nama prop harus sama persis** dengan yang dipakai komponen (lihat §4). Bentuk data ikuti `resources/js/types/magang.ts` — itu kontrak tipe yang sudah disepakati frontend.
4. **Dua tree `resources`.** Yang AKTIF (dibangun Vite) adalah **`resources/js/`** (subfolder kapital: `Pages/`, `Layouts/`, `Components/`). Folder **`Resources/` (R besar) adalah shadow tree yang TIDAK dipakai** — abaikan, jangan edit.
5. **Jangan jalankan `npm run types:check`** untuk validasi — ada ~106 error casing pre-existing dari shadow tree. Pakai `npm run build` + `npx eslint <file>`.

---

## 2. Yang harus dikerjakan backend (ringkas)

| Area | Tindakan |
|---|---|
| **Auth OTP** | Buang registrasi/reset Fortify; login 2-langkah (email → OTP 6 digit via SMTP). Hash OTP disimpan di `users.password`, verifikasi `Auth::attempt(email, otp)`. |
| **Middleware role** | `EnsureUserRole` → bungkus rute dasbor: `mahasiswa` (`/dashboard`,`/pengajuan`,`/penyelesaian`), `admin_verifikator` (`/verifikator/*`), `admin_opd` (`/opd/*`). |
| **Controller + props** | Ganti tiap `Route::inertia` (kecuali yang murni statis) jadi controller yang mengirim props sesuai §4. |
| **Form pendaftaran publik** | Endpoint `POST` untuk form di `welcome.tsx` (section `#daftar`) — buat `InternshipApplication` status `pending_verifikator` + kirim email tiket. |
| **Aksi domain** | Endpoint untuk forward/tolak (verifikator), setujui/tolak (OPD), laporan/survei/sertifikat (penyelesaian). Lihat daftar TODO §5. |
| **Keamanan** | Throttle login, tabel `form_rate_limits` (IP+email/WA per hari), captcha geser/puzzle di form publik. |

> Model, enum, migration, & seeder domain (`AdminSeeder`, `OpdSeeder`, `FaqSeeder`) sebagian besar **sudah ada**. Yang kurang adalah controller/wiring.

---

## 3. Peta route → page → controller

File: `routes/web.php` (saat ini semua masih `Route::inertia` sementara, ditandai blok "PRATINJAU FRONTEND").

| Path | Page Inertia | Akses | Controller yang perlu dibuat |
|---|---|---|---|
| `/` | `welcome` | publik | statis / `HomeController` (kirim daftar OPD untuk dropdown form) |
| `/login-otp` | `auth/otp-login` | publik | `OtpLoginController` (request + verify) |
| `/lacak` | `lacak` | publik | `LacakController` (cari by `?tiket=`) |
| *(POST)* form `#daftar` | — | publik | `PengajuanController@store` |
| `/dashboard` | `mahasiswa/dashboard` | mahasiswa | `MahasiswaDashboardController` |
| `/pengajuan` | `mahasiswa/pengajuan` | mahasiswa | `PengajuanSayaController` |
| `/penyelesaian` | `mahasiswa/penyelesaian` | mahasiswa | `PenyelesaianController` |
| `/verifikator` | `verifikator/dashboard` | verifikator | `VerifikatorDashboardController` |
| `/verifikator/masuk` | `verifikator/masuk` | verifikator | `VerifikatorInboxController` |
| `/verifikator/riwayat` | `verifikator/riwayat` | verifikator | `VerifikatorRiwayatController` |
| `/opd` | `opd/dashboard` | OPD | `OpdDashboardController` |
| `/opd/keputusan` | `opd/keputusan` | OPD | `OpdKeputusanController` |
| `/opd/peserta` | `opd/peserta` | OPD | `OpdPesertaController` |
| `/bantuan` | `bantuan` | semua login | kirim `{ user }` (+ FAQ dari DB bila mau dinamis) |
| `/pengaturan` | `pengaturan` | semua login | kirim `{ user }` |

> **Catatan:** wizard `/pengajuan/baru` **sudah dihapus**. Pendaftaran sekarang lewat form di `welcome.tsx` (anchor `#daftar`). Jangan hidupkan kembali rute itu.

---

## 4. Kontrak props per halaman

Bentuk objek mengacu ke `resources/js/types/magang.ts`. Tiap page sudah punya mock default — cukup kirim prop bernama sama.

- **`mahasiswa/dashboard`** → `{ user: MagangUser, application: InternshipApplication | null }`
- **`mahasiswa/pengajuan`** → `{ user, application: InternshipApplication | null, documents?: ApplicationDocument[] }`
  - `ApplicationDocument = { label, file_name, url? }` (dokumen BUKAN field model — kirim terpisah).
- **`mahasiswa/penyelesaian`** → `{ user, application }` (pakai `final_report`, `survey_submitted`, `certificate_available`).
- **`verifikator/dashboard`** → `{ user, applications: InternshipApplication[] }`
- **`verifikator/masuk`** → `{ user, applications: InternshipApplication[] }` (hanya status `pending_verifikator`).
- **`verifikator/riwayat`** → `{ user, applications: InternshipApplication[] }` (arsip yang sudah diputuskan).
- **`opd/dashboard`** → `{ user, opd: Opd, applications: InternshipApplication[] }`
- **`opd/keputusan`** → `{ user, opd, applications }` (hanya `forwarded_opd`).
- **`opd/peserta`** → `{ user, participants: Participant[] }`
  - `Participant = { student_name, application: InternshipApplication }` (nama peserta BUKAN field application — kirim terpisah).
- **`bantuan`** / **`pengaturan`** → `{ user: MagangUser }`

**Shared props** (semua page, via `app/Http/Middleware/HandleInertiaRequests.php`): `name`, `auth.user`, `sidebarOpen`.

### Kepemilikan field form pengajuan (PENTING)
- **Diisi siswa** (form publik `#daftar`): identitas, `institution_name`, `tujuan_magang`, `campus_supervisor` (pembimbing kampus/sekolah), `campus_supervisor_whatsapp` (No. WA dosen/guru pembimbing, wajib), `guardian_name`, `guardian_whatsapp` (No. WA penanggung jawab, wajib), `start_date`, `duration_months`/`end_date`, dokumen.
- **Diisi Admin Verifikator saat forward** (KELUAR dari form publik): `opd`, `division`, `field_supervisor`, `person_in_charge`.

---

## 5. Daftar endpoint aksi (dari komentar `TODO(backend)` di kode)

Semua handler frontend kini simulasi `setTimeout` + `toast`. Cari string `TODO(backend)` untuk lokasi pastinya.

**Auth OTP** (`Pages/auth/otp-login.tsx`)
- `POST /login/otp/request` `{ email }`
- `POST /login/otp/verify` `{ email, otp }` → redirect per role
- `POST /logout`

**Pendaftaran publik** (`welcome.tsx` section `#daftar`)
- `POST /pengajuan` `{ ...form }, { forceFormData: true }` (ada File) → buat application, kirim email tiket `MGG-{tahun}-{nnnn}`

**Lacak** (`Pages/lacak.tsx`)
- `GET /lacak?tiket=...` → `{ application, ticket }`

**Verifikator** (`verifikator/dashboard.tsx`, `verifikator/masuk.tsx`)
- `POST /verifikator/pengajuan/{id}/teruskan` `{ opd_id, division, field_supervisor, person_in_charge }`
- `POST /verifikator/pengajuan/{id}/tolak` `{ rejection_reason }`

**OPD** (`opd/dashboard.tsx`, `opd/keputusan.tsx`)
- `POST /opd/pengajuan/{id}/setujui`
- `POST /opd/pengajuan/{id}/tolak` `{ rejection_reason }`
- (scope: hanya application milik OPD yang login)

**Penyelesaian** (`mahasiswa/penyelesaian.tsx`)
- `POST /penyelesaian/laporan` (multipart, `forceFormData`)
- `POST /penyelesaian/survei` `{ ratings, comment }`
- `GET /penyelesaian/sertifikat` (unduh PDF)

**Pengaturan** (`pengaturan.tsx`)
- `PATCH /pengaturan/profil` `{ name, whatsapp_number, ...extra per-role }`
- `PATCH /pengaturan/notifikasi` `{ email_status, reminder_laporan, ringkasan }`

---

## 6. Lifecycle status (enum `App\Enums\ApplicationStatus`)

```
pending_verifikator → forwarded_opd → approved → ongoing
   → completion_submitted → completed
                 └── rejected (cabang terminal)
```
Label & warna badge untuk UI sudah didefinisikan di `STATUS_META` (`types/magang.ts`) — backend tak perlu kirim label, cukup kirim `status` mentah.

---

## 7. Alur kerja & verifikasi

```bash
composer dev          # serve + queue + vite sekaligus (dev lokal)
composer test         # pint --test + phpstan + artisan test (samakan dgn CI)
php artisan test --compact
vendor/bin/pint --dirty --format agent   # format PHP sebelum commit
php artisan migrate:fresh --seed         # siapkan data (admin, opd, faq)
```

Setelah ganti `Route::inertia` → controller, cek `php artisan route:list` memastikan path tidak berubah.

Detail konvensi (PHP style, Inertia v3, Pest, Wayfinder, Boost MCP) ada di **`AGENTS.md`** — wajib dibaca sebelum perubahan non-trivial. Skill domain di `.cursor/skills/**`.

---

## 8. Sumber kebenaran

- Tipe domain: `resources/js/types/magang.ts`
- PRD & flowchart: `resources/js/Pages/PRD & Flowchart.txt` + `flowchart.png`
- Instruksi repo: `CLAUDE.md`, `AGENTS.md`
