# Rencana Implementasi — `revisi_akhir.md`

**Sumber:** `resources/js/pages/revisi_akhir.md` (5 area revisi mentor)
**Disusun:** 2026-08-05 · **Branch:** `front` · **Status:** RENCANA — belum ada satu baris pun dikerjakan.

Dokumen ini memetakan tiap poin revisi ke kondisi kode saat ini (dengan bukti
`file:baris`), perubahan yang dibutuhkan, kontrak prop, tes, dan keputusan yang
masih menunggu jawaban. Urutan pengerjaan ada di bagian [Urutan & Batch](#urutan--batch).

> **Aturan main yang berlaku untuk SELURUH batch** (dari CLAUDE.md / AGENTS.md):
> - Kontrak prop-path HANDOFF-BACKEND.md hanya boleh **ditambah (aditif)**, tidak diubah/dihapus.
> - Setiap halaman yang membungkus dirinya dengan `MagangLayout` **wajib** menerima prop `user`
>   (lupa = layar putih, server tetap 200). Tes halaman baru wajib `assertHas('user.name')`.
> - Tes feature baru diletakkan di `tests/Feature/Feature/{Auth,Mahasiswa,Opd,Verifikator,Penyelesaian,Security}/`.
> - Gate wajib sebelum sebuah batch disebut selesai: `composer ci:check`
>   (Pint · PHPStan `--memory-limit=1G` · Pest di PostgreSQL `magang_test` · tsc · eslint · prettier) + `npm run build`.
> - Halaman besar (`opd/peserta.tsx` 1214 baris, `opd/dashboard.tsx` 1949) diedit **di tempat**;
>   memecahnya jadi modul bukan bagian dari revisi ini kecuali disebut eksplisit di bawah.

---

## P0 — Prasyarat: kembalikan suite ke hijau ✅ SELESAI 2026-08-05

> **Hasil:** `php artisan test` → **216 tes: 206 lulus / 10 skip / 0 gagal (1144 assertion)**.
> Baseline hijau. Tidak ada kode produksi yang diubah — semuanya perbaikan fixture.
>
> Rincian yang dikerjakan:
> - **`Verifikator/SkNumberTest.php`** — helper baru `skOpdSiapAcc()` (kop lengkap) +
>   `skSigner()`, kedua tes approve kini mengirim `signer_id` dan memakai
>   `Storage::fake('local')` (approve dengan penandatangan mencetak draft PDF).
> - **`Penyelesaian/EndToEndFlowTest.php`** — alur end-to-end **ditulis ulang mengikuti
>   siklus hidup yang sekarang benar-benar berjalan**, bukan jalur legacy yang sudah
>   tak terjangkau lewat HTTP: approve + `signer_id` → `waiting_tte` (draft tercetak,
>   **tanpa** email) → unggah surat ber-TTE → `ongoing` + `SendSignedAcceptanceLetterJob`
>   → cron (idempoten) → laporan akhir → **`needs_certificate`** (bukan langsung
>   `completed`, karena pengajuan ini punya snapshot TTE) → setujui laporan → draft
>   sertifikat (snapshot penandatangan) → unggah sertifikat ber-TTE → `completed` +
>   `SendSignedCertificateJob` → peserta mengunduh.
> - **`Opd/TteFlowTest.php`** — `tteOpd()` menyetel `quota_used => 0` eksplisit
>   (default 0 hanya berlaku di DB; di memori nilainya null sehingga assert
>   "kuota tidak berubah" membandingkan null vs 0).
>
> **Catatan cakupan:** jalur sertifikat *legacy* (sertifikat terkunci → survei wajib →
> unduhan terbuka) tidak hilang dari suite — ia tetap diuji di
> `Penyelesaian/CompletionFlowTest.php` (4 tes: sertifikat terkunci, survei membuka
> kunci, izin unduh pemilik/non-pemilik, sertifikat terkunci tak bisa diunduh).
>
> **Temuan sampingan (belum diperbaiki, perlu keputusan → lihat [Keputusan #7](#keputusan-yang-masih-terbuka)):**
> `Opd\TteController::uploadCertificate()` (`:112`) menyetel `is_download_locked = false`
> saat sertifikat ber-TTE diunggah, jadi **jalur TTE melewati kewajiban survei
> kepuasan** — padahal invarian CLAUDE.md menyebut survei wajib sebelum unduhan
> terbuka. Jalur legacy (`Opd\ReportController::uploadCertificate`) masih mengunci.

**Wajib dikerjakan lebih dulu.** Baseline sebelum perbaikan di branch `front`:
**216 tes — 202 lulus, 10 skip, 4 GAGAL.** Selama 4 tes ini merah, kita tidak
punya jaring pengaman untuk menilai apakah batch berikutnya merusak sesuatu.

| Tes | Akar masalah | Perbaikan |
| --- | --- | --- |
| `Penyelesaian/EndToEndFlowTest.php:84` | POST `/opd/pengajuan/{id}/approve` tanpa `signer_id`, OPD tanpa kop | Lengkapi fixture: `OpdSigner` + `letterhead_address/phone/email`, kirim `signer_id` |
| `Verifikator/SkNumberTest.php:42` & `:62` | sama seperti di atas → approve 422 → `sk_number` null | sama |
| `Opd/TteFlowTest.php:477` | `$kuotaAwal = $opd->quota_used` dibaca dari model yang baru dibuat (null di memori), dibandingkan dengan `0` hasil `refresh()` | `$opd->refresh()` dulu, atau set `quota_used => 0` eksplisit di `tteOpd()` |

**Jangan** melonggarkan `ApproveApplicationRequest` untuk menghijaukan tes —
gate "approve wajib penandatangan + kop lengkap" adalah invarian TTE yang
sengaja dipasang (CLAUDE.md, bagian TTE). Yang salah fixture-nya, bukan aturannya.

**Ukuran:** S (3 file tes). **Tanpa perubahan kode produksi.**

---

## R1 — Presensi & riwayat kegiatan ✅ SELESAI 2026-08-05

> **Hasil:** `php artisan test` → **222 lulus / 0 skip / 0 gagal (1185 assertion)**.
> `composer ci:check` (Pint · PHPStan · Pest · tsc · eslint · prettier) lulus.
> `npm run build` lulus.
>
> **Keputusan:** #1 → (a) tampilkan "—" untuk jam selesai, #3 → tampilkan dossier
> antar-OPD (tanpa dokumen/berkas), #6 → default 31 hari + opsi 90/semua.
>
> Rincian yang dikerjakan:
> **Backend:**
> - **`PresensiController::entryPayload()`** — tambah kunci **aditif** `start_time`,
>   `end_time`, `checked_out_at` (nullable). Tidak ada kunci lama yang diubah/dihapus.
> - **`PresensiController::collectForUsers()`** — method baru, menerima param `$maxAge`
>   (default 31, `'all'` untuk semua) → query log presensi per rentang.
> - **`Opd\DashboardController::peserta()`** — membaca `?presensi=31|90|semua` via
>   `request()->query('presensi', '31 days')`, meneruskan ke `collectForUsers()`.
> - **`Verifikator\UserController::index()`** — membaca `?presensi=31|90|semua`,
>   meneruskan ke `collectForUsers()`. Pola sama.
>
> **Frontend:**
> - **`resources/js/components/presensi-history.tsx`** — komponen bersama hasil
>   ekstraksi dari duplikasi di `opd/peserta.tsx` dan `verifikator/users/index.tsx`.
>   Fitur: ringkasan statistik (N hadir / izin / sakit), 31/90/semua log per hari
>   (tanggal, badge status, jam masuk, jam selesai `—` untuk data lama, rincian
>   kegiatan, lampiran foto).
> - **`opd/peserta.tsx`** — `DetailDialog` dirombak dengan tab `ringkasan >
>   detail > presensi > jejak`, tombol panel disediakan langsung di dialog
>   (tanpa `Dialog` bersarang). `PresensiHistory` diimpor dari komponen baru.
> - **`verifikator/users/index.tsx`** — `UserDetailDialog` ikut punya panel
>   presensi yang sama, tanpa duplikasi kode.
>
> **Tes:**
> - **`tests/Feature/Feature/Opd/PresensiMonitoringTest.php`** (baru): 3 pengujian
>   OPD, 3 pengujian Verifikator.

> Revisi: tombol khusus "Riwayat Presensi" di pop-up Kelola Peserta; informasi
> mahasiswa ditampilkan di atas tombol itu; OPD **dan** Verifikator dapat
> memantau status kehadiran harian, jam masuk, jam selesai, dan rincian kegiatan.

### Kondisi sekarang
- `resources/js/pages/opd/peserta.tsx:620` — `PresensiHistory` di-render **inline**
  di dalam `DetailDialog` (`:925`), jadi ia ikut menambah panjang scroll dialog
  yang sudah memuat 17 baris identitas + dokumen + timeline + panel laporan.
- Payload sudah tersedia dan ter-otorisasi:
  - `app/Http/Controllers/Opd/DashboardController.php:106-114` → `participants[].presensi`, **31 hari terakhir**.
  - `app/Http/Controllers/Verifikator/UserController.php:53-61` → `users[].presensi`, 31 hari terakhir (dipakai `UserDetailDialog` di `verifikator/users/index.tsx:223`).
  - Keduanya memakai `PresensiController::entryPayload()` (`:122`) → `{id, activity_date, status, checked_in_at, details, attachments[]}`.
- **Tidak ada "jam selesai".** Sejak batch 5 presensi adalah *absen harian*:
  `unique(user_id, activity_date)`, jam absen dibaca dari `created_at`,
  `start_time`/`end_time` tinggal kolom nullable warisan (`app/Models/PresensiLog.php`).
  → lihat [Keputusan #1](#keputusan-yang-masih-terbuka).

### Perubahan
**Frontend — `resources/js/pages/opd/peserta.tsx`**
1. `PresensiHistory` diubah dari blok inline menjadi konten sebuah **panel terpisah**
   yang dibuka lewat tombol `Riwayat Presensi` (ikon `CalendarCheck`, gaya sama
   dengan tombol aksi lain di dialog). Implementasi: state tab di dalam
   `DetailDialog` (`'ringkasan' | 'detail' | 'presensi' | 'jejak'`), **bukan**
   `Dialog` bersarang — dialog di dalam dialog menyulitkan fokus & Esc.
2. Di atas tombol, tampilkan **ringkasan peserta** (permintaan eksplisit mentor):
   pas foto, nama, NIS/NIM, asal instansi, OPD/divisi, periode + sisa hari,
   status badge. Sumber datanya sudah ada semua di `participant.application`.
3. Tiap baris presensi ditampilkan lengkap: tanggal, badge status
   (hadir/izin/sakit), **jam masuk**, **jam selesai**, rincian kegiatan
   (`details`, saat ini di-`line-clamp-2` → dibuka penuh di panel khusus),
   dan lampiran foto.
4. Tambah ringkasan agregat di kepala panel: `N hadir · N izin · N sakit`
   dari rentang yang ditampilkan, plus catatan rentang ("31 hari terakhir").

**Frontend — `resources/js/pages/verifikator/users/index.tsx`**
5. Perlakuan yang sama di `UserDetailDialog` (`:223`) supaya "Verifikator dapat
   memantau" terpenuhi di menu Kelola User. Komponen presensi dipakai bersama:
   pindahkan ke `resources/js/components/presensi-history.tsx` (satu-satunya
   ekstraksi komponen yang direstui rencana ini — kode ini memang sudah
   diduplikasi di dua halaman, termasuk `PRESENSI_META` dan `formatTime`).

**Backend**
6. `PresensiController::entryPayload()` — tambah kunci **aditif**
   `start_time` + `end_time` (nullable) supaya frontend bisa menampilkan jam
   selesai untuk data yang punya, tanpa mengubah kunci lama.
7. Rentang: tambah query-param **pada route halaman** (`GET opd/peserta?presensi=31|90|semua`,
   `GET verifikator/users?presensi=…`) yang dibaca controller. Alasan memilih
   ini ketimbang endpoint JSON baru: repo ini **tidak punya lapisan REST/JSON**
   (Inertia langsung), jadi menambah endpoint JSON melanggar arsitektur.
   Default tetap 31 hari agar payload tidak membengkak.

### Tes
- `tests/Feature/Feature/Opd/PresensiMonitoringTest.php` (baru): peserta punya
  3 log → `participants.0.presensi` berisi 3 entri dengan `start_time`/`end_time`;
  `?presensi=semua` mengembalikan log di luar 31 hari; OPD lain 403/tak melihat.
- Tambahan di `tests/Feature/Feature/Verifikator/` untuk jalur Kelola User.
- `tests/Feature/Feature/Mahasiswa/PresensiTest.php` — pastikan kunci lama utuh.

**Ukuran:** M. **File tersentuh:** 2 controller, 1 controller presensi, 2 halaman React, 1 komponen baru, 2 file tes.

---

## R2 — Shortcut "Data Detail", dossier, dan batas satu magang aktif ✅ SELESAI 2026-08-06

> **Hasil:** R2a + R2b selesai di batch B; R2c backend + tes selesai di commit
> `1e7d637`, **sisa frontend-nya dituntaskan 2026-08-06**.
> Gate: `composer ci:check` ✅ · `php artisan test` → **232 tes: 222 lulus /
> 10 skip / 0 gagal (1200 assertion)** · `npm run build` ✅.
>
> **R2a/R2b** — `DetailDialog` di `opd/peserta.tsx` kini bertab
> (`ringkasan · detail · presensi · jejak`) dengan panel aksi tetap di luar tab;
> prop aditif `riwayat_pengajuan` dikirim `Opd\DashboardController::peserta()`
> dengan bentuk kunci yang sama seperti `Verifikator\UserController`.
>
> **R2c** — `ApplicationStatus::activeStatuses()`, hook `after()` di
> `StoreApplicationRequest`, guard `DomainException` di
> `SubmissionService::submit()` **dan** `::resubmit()`, tes
> `Mahasiswa/SatuMagangAktifTest.php` (16 tes). `rejected` sengaja tak memblokir.
>
> **Tiga lubang di sisi penyampaian pesan, baru ditutup 2026-08-06:**
>
> 1. **Bug: `DomainException` lolos jadi HTTP 500.**
>    `Mahasiswa\ApplicationController::store()` memanggil `submit()` **tanpa
>    `try/catch`**, padahal `resubmit()` di file yang sama menangkapnya.
>    Lapis-2 dipasang justru karena `/pengajuan` publik — dua POST bersamaan
>    dari email yang sama sama-sama lolos validasi, lalu yang kedua kena guard
>    service → 500, bukan pesan yang bisa dibaca pemohon. Kini dibungkus
>    `try/catch` → `back()->withInput()->withErrors(['email' => …])`.
>    Tes baru mem-mock `PengajuanServiceContract` — kondisi balapannya sendiri
>    tak bisa dibuat andal lewat HTTP, jadi yang diuji kontrak lapisannya.
> 2. **`welcome.tsx`** — input email tak punya blok galat sama sekali; pesan
>    R2c hanya muncul di ringkasan generik dekat tombol kirim, dan
>    `preserveScroll: true` membuatnya terlewat. Kini ada blok `{errors.email}`
>    + border rose + `aria-invalid`/`aria-describedby` (mengikuti pola
>    `errors.photo`), plus `onError` → `scrollIntoView`. Ringkasan generik
>    dipertahankan sebagai jaring pengaman field lain.
> 3. **`mahasiswa/pengajuan.tsx`** — `onError: () => router.visit('/#daftar')`
>    dengan komentar "backend menyusul" yang sudah basi sejak R15, sehingga
>    `errors.resubmit` tak pernah tampil dan peserta dilempar ke form publik
>    yang menolaknya lagi dengan kalimat berbeda. Redirect dihapus, alasan
>    ditampilkan di tempat.
>
> **Keputusan #2 sengaja MASIH TERBUKA.** Perilaku sekarang (larangan permanen
> setelah `completed`) dipertahankan apa adanya, tapi keputusannya belum
> ditutup — jangan anggap final.
>
> **Catatan alat:** PHPStan lokal wajib `--memory-limit=1G` (128M bawaan bikin
> worker paralelnya mati dan `composer ci:check` gagal sebelum menyentuh tes),
> dan `resources/js/pages/*.md` kini masuk `.prettierignore` — prettier
> menggabung daftar bernomor jadi paragraf dan merusak isi dokumen ini.
>
> **Temuan sampingan, belum diperbaiki:** `RegistrationSeeder:45` memakai tiket
> `MGG-2026-0051` — melanggar format kanonik `MGG-YYYY-NNNNNN` (6 digit).

> Revisi: pop-up Kelola Peserta terlalu panjang → buat pintasan "Data Detail";
> menampilkan rekam jejak utuh (status pengajuan, keaktifan absensi, riwayat
> pendaftaran sebelumnya); sistem memastikan **satu mahasiswa hanya boleh punya
> satu magang aktif** dan tidak boleh mendaftar lagi setelah selesai.

### R2a — Restrukturisasi `DetailDialog`
**Kondisi sekarang:** `opd/peserta.tsx:782-1020` — satu kolom scroll panjang berisi
pas foto → 17 `DetailRow` → dokumen → tombol surat → `StatusTimeline` →
`PresensiHistory` → panel Laporan Akhir → tombol TTE → tombol Selesaikan.

**Rencana:** dialog dibagi menjadi *kepala tetap* + *tab* + *panel aksi tetap*.

```
┌──────────────────────────────────────────────┐
│ [foto] Nama Peserta            [badge status]│  ← kepala tetap
│        MGG-2026-000042 · Bidang TIK          │
│        15 Jul – 8 Agu 2026 · sisa 12 hari    │
├──────────────────────────────────────────────┤
│ [Ringkasan][Data Detail][Presensi][Jejak]    │  ← tab (shortcut)
├──────────────────────────────────────────────┤
│ …isi tab…                                    │
├──────────────────────────────────────────────┤
│ Aksi: Setujui Laporan · Unggah Sertifikat …  │  ← tetap terlihat
└──────────────────────────────────────────────┘
```

- **Ringkasan** — 6 fakta terpenting + dokumen pendukung.
- **Data Detail** — seluruh `DetailRow` yang sekarang (identitas, kontak, SK, penempatan).
- **Presensi** — panel dari [R1](#r1--presensi--riwayat-kegiatan).
- **Jejak** — `StatusTimeline` + **riwayat pendaftaran sebelumnya** (baru, R2b).
- Panel aksi (`ApproveReportButton`, `UploadCertificate`, `CompletionLetter`,
  `ReissueTteAction`, `CompleteAction`) **tidak** ikut masuk tab — itu pekerjaan
  utama admin dan harus selalu terjangkau.
- A11y mengikuti pola dasbor OPD hasil redesain 2026-07-30: `aria-pressed` pada
  tombol tab, target sentuh `min-h-11`, `focus-visible:ring-4`, `tabular-nums`.

### R2b — Dossier: riwayat pendaftaran sebelumnya
**Backend** `Opd\DashboardController::peserta()` — tambah kunci aditif per participant:

```php
'riwayat_pengajuan' => InternshipApplication::query()
    ->where('user_id', $app->user_id)
    ->where('id', '!=', $app->id)
    ->with('opd:id,name')
    ->latest()
    ->get()
    ->map(fn ($a) => [
        'ticket_number' => $a->ticket_number,
        'status' => $a->status->value,
        'opd_name' => $a->opd?->name,
        'start_date' => $a->start_date->toDateString(),
        'end_date' => $a->end_date->toDateString(),
        'created_at' => $a->created_at?->toISOString(),
    ])->all(),
```

Verifikator sudah punya padanannya (`UserController:75-81`, maks 5) — samakan
bentuk kuncinya supaya komponen tab "Jejak" bisa dipakai dua-duanya.
→ lihat [Keputusan #3](#keputusan-yang-masih-terbuka) soal privasi antar-OPD.

**Tipe:** tambah `interface RiwayatPengajuan` di `resources/js/types/magang.ts`
(aditif; `Participant` di `peserta.tsx:55` ikut diperluas).

### R2c — Batas satu magang aktif
**Kondisi sekarang:** tidak ada batas sama sekali. `SubmissionService::submit()`
(`:65`) memakai `User::firstOrCreate(['email' => …])` lalu selalu membuat
`InternshipApplication` baru — satu email bisa punya pengajuan aktif berapa pun.

**Rencana (dua lapis, sesuai pola repo):**
1. **Validasi** di `app/Http/Requests/Application/StoreApplicationRequest.php`
   lewat hook `after()` (pola yang sama dipakai `ApproveApplicationRequest`):
   cari user by `email`; bila punya pengajuan berstatus **aktif**
   (`pending_verifikator`, `forwarded_opd`, `waiting_tte`, `approved`,
   `ongoing`, `completion_submitted`, `needs_certificate`) → error di field
   `email`: *"Email ini masih memiliki pengajuan magang yang sedang berjalan
   (tiket MGG-…). Selesaikan atau tunggu keputusannya sebelum mendaftar lagi."*
   Bila pernah `completed` → *"Email ini sudah pernah menyelesaikan program
   magang. Pendaftaran ulang tidak diperbolehkan."*
   Status `rejected` **tidak** memblokir (jalur "Ajukan Ulang" harus tetap hidup).
2. **Guard domain** di `SubmissionService::submit()` → `DomainException` bila
   aturan yang sama dilanggar (endpoint publik; jangan bergantung pada satu lapis saja).
   `resubmit()` (`:405`) sudah menjaga `rejected` + kepemilikan; tambahkan cek
   yang sama supaya peserta tak bisa menekan "Ajukan Ulang" pada tiket lama
   setelah punya pengajuan aktif baru.
3. **Frontend** `welcome.tsx` — pesan galat `email` sudah ter-render oleh
   `useForm().errors`; cukup pastikan blok error di dekat field email dan
   scroll-to-error bekerja. Tidak ada perubahan kontrak prop.
4. **Helper terpusat:** `ApplicationStatus::activeStatuses(): array` di
   `app/Enums/ApplicationStatus.php` supaya daftar status aktif tidak
   ditulis ulang di tiga tempat (request, service, dasbor).

**Dampak yang harus diaudit sebelum merge:**
- `RegistrationSeeder` dan factory tes banyak membuat >1 pengajuan untuk user
  yang sama — cek `tests/Feature/Feature/Mahasiswa/ResubmitTest.php` dan
  `EndToEndFlowTest`. Guard hanya berlaku di jalur `submit()`/HTTP, jadi
  `InternshipApplication::factory()` tetap bebas; yang perlu dicek adalah tes
  yang benar-benar POST `/pengajuan` dua kali.

**Tes baru** (`tests/Feature/Feature/Mahasiswa/SatuMagangAktifTest.php`):
pengajuan kedua saat masih `ongoing` → 422 di `email`, tidak ada baris baru;
setelah `rejected` → boleh; setelah `completed` → ditolak; `resubmit` tetap
jalan untuk tiket rejected tanpa pengajuan aktif lain.

**Ukuran:** R2a M · R2b S · R2c M.

---

## R3 — Kelola Surat dinamis, perataan teks, standardisasi template ✅ SELESAI 2026-08-07

> **Hasil:** seluruh R3a/R3b/R3c + Keputusan #4 (nomor per OPD) & #5 (snapshot
> surat penyelesaian) tuntas. Gate: `composer ci:check` ✅ · `php artisan test`
> → **232 tes: 222 lulus / 10 skip / 0 gagal (1201 assertion)** · `npm run build` ✅.
> Perubahan dikerjakan di atas working tree yang sudah memuat migrasi+model+
> service R3 dari sesi sebelumnya; batch ini menyelesaikan request rules,
> kolom `signers()` di 3 controller, wiring `ensureCompletionSnapshot` +
> `letter_code` per OPD, empat view PDF yang diseragamkan, dan frontend
> `surat.tsx` dengan field penandatangan lengkap.
>
> **R3a** — `Store/UpdateOpdSignerRequest` menerima `nik` (digits:16),
> `degree_prefix/suffix`, `rank`, `rank_class`, `on_behalf_of` (semua nullable).
> `SubmissionService::approve` & `::reissueForTte` kini memakai helper
> `acceptanceSnapshot()` yang menyebar seluruh `SNAPSHOT_FIELDS` (bukan 4 kolom
> lama hardcoded). `LetterController`, `TteController`, `DashboardController`
> memilih kolom baru di `signers()`. `surat.tsx`: `SignerRow`/`SignerSection`
> memakai satu `form` state, tampilan nama bergelar + pangkat/golongan + a.n.,
> placeholder baru di `LetterDocumentService::PLACEHOLDERS`.
>
> **R3b** — `.body` pada layout bersama kini `text-align: justify` (+
> `text-justify: inter-word`); judul tetap center, tabel rincian tetap kiri.
>
> **R3c** — view PDF diseragamkan lewat `pdf/layouts/surat.blade.php` (CSS kop +
> `@include` letterhead) dan `pdf/partials/signature.blade.php` (blok ttd
> parametrik: tempat/tanggal/`on_behalf_of`/jabatan/nama bergelar/NIP/NIK/pangkat).
> Bug `completion_letter` (kop & pejabat Kominfo hardcoded) ditutup: kini kop
> memakai data OPD dinamis + snapshot `completion_signer_*` via
> `LetterDocumentService::ensureCompletionSnapshot()` yang di-wire di
> `ReportController::generateCompletionLetter` (Keputusan #5).
>
> **Keputusan #4** — `SkNumberService::next()/setStart()/current()` menerima
> `?int $opdId`; counter dipisah per OPD di `sk_counters`
> (`key` = `acceptance:{opd_id}` / `completion:{opd_id}`) dan kode unit memakai
> `opds.letter_code` (default `401.106`). Pemanggil di `SubmissionService` &
> `ReportController` meneruskan `opd_id`; `SkNumberTest` diperbarui ke semantik
> per-OPD.

> Revisi: variabel penandatangan lebih lengkap (nama, NIP, **NIK**, gelar
> depan/belakang, pangkat/golongan, keterangan "atas nama Kepala Dinas");
> teks draf surat rata kiri/justify; template surat penerimaan, surat selesai,
> dan sertifikat diseragamkan — beda hanya kop, nomor surat per OPD, dan pejabat.

### R3a — Variabel penandatangan
**Kondisi sekarang:** `opd_signers` hanya `name`, `title`, `nip`, `is_primary`
(migration `2026_07_29_120823`). Snapshot di `internship_applications`
(`acceptance_signer_id/name/title/nip`) dan `certificates` (`signer_*`).

**Migration baru** `2026_08_XX_000100_add_official_fields_to_opd_signers`:

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `nik` | `string(16)` nullable | tidak wajib — data lama tak punya |
| `degree_prefix` | `string(50)` nullable | gelar depan (Dr., Ir.) |
| `degree_suffix` | `string(50)` nullable | gelar belakang (S.Kom., M.M.) |
| `rank` | `string(100)` nullable | pangkat (Pembina Tk. I) |
| `rank_class` | `string(20)` nullable | golongan (IV/b) |
| `on_behalf_of` | `string(255)` nullable | "a.n. Kepala Dinas Kominfo" |

**Migration kedua** `…_000200_add_signer_detail_snapshots`: kolom snapshot yang
sama (prefix `acceptance_signer_*` di `internship_applications`, `signer_*` di
`certificates`). **Wajib** — invarian CLAUDE.md: dokumen lama harus tetap
menyebut pejabat yang benar-benar menandatangani, dan snapshot ditulis **sekali**.

**Kode yang ikut berubah:**
- `app/Models/OpdSigner.php` — `#[Fillable]`.
- `StoreOpdSignerRequest` / `UpdateOpdSignerRequest` — rules `nullable|string|max:…`, `nik` `digits:16` (nullable).
- `Opd\DashboardController::signers()` (`:132-138`) — **`get([...])` memilih kolom eksplisit; kolom baru wajib ditambahkan** atau frontend menerima `undefined` diam-diam. Idem `Opd\LetterController`.
- `LetterDocumentService::ensureAcceptanceSnapshot()` / `ensureCertificateSnapshot()` (`:114`, `:134`) — ikut menyalin field baru (early-return tetap dipertahankan).
- `resources/js/pages/opd/surat.tsx` — `SignerRow` (`:282`) + `SignerSection` (`:458`) dapat field baru; tetap gaya "Kelola FAQ" (list → edit inline → Jadikan Utama → hapus dua langkah).
- Placeholder **aditif** di `LetterDocumentService::PLACEHOLDERS`:
  `{penandatangan}` (gelar depan + nama + gelar belakang), `{jabatan_penandatangan}`,
  `{nip_penandatangan}`. `REQUIRED_PLACEHOLDERS` **tidak diubah** — menambah yang
  wajib akan menolak seluruh template yang sudah tersimpan.
- Helper `OpdSigner::formattedName()` (gelar depan + nama + gelar belakang) +
  padanannya untuk snapshot, dipakai view PDF dan email.

### R3b — Perataan teks
- `resources/views/pdf/acceptance_letter.blade.php:43` (`white-space: pre-line`)
  dan `certificate.blade.php:20` (`.body`) → tambah `text-align: justify;`
  (+ `text-justify: inter-word`). Judul tetap `center`, tabel rincian tetap kiri.
- DomPDF mendukung `justify`; verifikasi visual lewat draft nyata, bukan hanya tes.

### R3c — Standardisasi template
**Temuan penting (bug, bukan sekadar kerapian):**
`resources/views/pdf/completion_letter.blade.php:35-55` **menulis kop Kominfo
secara hardcoded** (nama dinas, alamat, telepon, pos-el) alih-alih memakai
`pdf.partials.letterhead`, dan blok tanda tangannya (`:104-107`) berisi
`a.n. Kepala Dinas Komunikasi dan Informatika` + garis kosong. Artinya **surat
penyelesaian dari OPD mana pun terbit dengan kop dan pejabat Kominfo.**

**Rencana:**
1. Buat layout bersama `resources/views/pdf/layouts/surat.blade.php`
   (CSS yang sekarang terduplikasi di 3 view + `@include` kop + slot judul/isi/ttd).
2. Buat `resources/views/pdf/partials/signature.blade.php` — satu blok tanda
   tangan parametrik (tempat, tanggal, `on_behalf_of`, jabatan, nama bergelar,
   NIP, opsional NIK/pangkat-golongan).
3. Ketiga view (`acceptance_letter`, `completion_letter`, `certificate`)
   memakai layout + partial yang sama; perbedaan tinggal judul, nomor, isi.
4. `completion_letter` memakai kop dinamis + snapshot penandatangan
   (→ [Keputusan #5](#keputusan-yang-masih-terbuka)).
5. Nomor surat per OPD → [Keputusan #4](#keputusan-yang-masih-terbuka).

### Tes
- `tests/Feature/Feature/Opd/TteFlowTest.php` — tambah: field penandatangan baru
  tersimpan & ikut ke snapshot; snapshot tetap utuh saat pejabat diganti
  (pola mutation-check yang sudah dipakai di file itu).
- Tes baru untuk `completion_letter`: OPD non-Kominfo → kop berisi nama OPD-nya,
  bukan "Dinas Komunikasi dan Informatika". Ingat: DomPDF mengompresi stream PDF,
  jadi isi dibaca lewat `View::composer` seperti tes TTE yang sudah ada.

**Ukuran:** L (2 migration, 4 view PDF, 1 service, 3 request, 1 halaman React, 2 controller).

---

## R4 — Simulasi status & indikator progres ✅ SELESAI 2026-08-07

> **Hasil:** `php artisan test` → **244 tes: 234 lulus / 10 skip / 0 gagal (1249 assertion)**.
> `composer ci:check` (Pint · PHPStan · Pest · tsc · eslint · prettier) lulus.
> `npm run build` lulus.

> Revisi: sediakan simulasi untuk **Menunggu TTE**, **Perlu Sertifikat**, **Perlu Keputusan**.

### R4a — Simulasi tiket untuk demo
**Rencana:** dua alat, keduanya di luar UI produksi.
1. `database/seeders/DemoSpectrumSeeder.php` — membuat satu tiket per status
   demo di atas, plus OPD demo yang **sudah punya kop + penandatangan** (tanpa
   itu approve diblokir gate TTE). **Tidak** dimasukkan ke `DatabaseSeeder`;
   dijalankan manual: `php artisan db:seed --class=DemoSpectrumSeeder`.
2. `app/Console/Commands/DemoTransitionCommand.php`
   (`magang:demo-status {tiket} {status}`) — memindahkan satu tiket ke status
   demo. Guard: `abort` bila `app()->isProduction()`.

**Penting:** keduanya harus memakai `SubmissionService` (approve dengan
`signer_id`, dst.), **bukan** `update(['status' => …])` mentah — supaya data demo
punya status-log, snapshot penandatangan, dan draft PDF seperti data sungguhan.

### R4b — Indikator progres masa magang
**Kondisi sekarang:** `progressPct()` sudah ada di `opd/peserta.tsx:81` tapi hanya
dipakai `ParticipantCard` (`:1033`).

**Rencana:** pindah ke `resources/js/lib/internship-progress.ts` dengan
klasifikasi eksplisit yang diminta mentor:

| State | Aturan | Warna |
| --- | --- | --- |
| `belum_mulai` | `start_date > hari ini` | slate |
| `aktif` | dalam periode | `#106feb` + sisa hari |
| `selesai` | status `completed` | emerald |
| `lewat_batas` | `end_date < hari ini` tapi status masih `ongoing` | amber/rose |

`lewat_batas` bukan hiasan: cron `magang:transition-statuses` jalan 01:00 WIB,
jadi tiket yang masih `ongoing` melewati `end_date` = cron belum/gagal jalan —
sinyal operasional yang berguna.

Dipakai di: `opd/dashboard.tsx` (kolom tabel), `opd/peserta.tsx` (kartu + kepala
dialog), `mahasiswa/dashboard.tsx`, dan `verifikator/dashboard.tsx`.
A11y: `role="progressbar"` + `aria-valuenow/min/max`, label teks (bukan warna saja), `tabular-nums`.

**Ukuran:** R4a M · R4b M. **Tanpa perubahan skema DB.**

> **Yang dikerjakan:**
> - **`app/Services/DemoStatusService.php`** (baru) — menggerakkan pengajuan ke
>   status target lewat jalur yang sama dengan data sungguhan: `forwardToOpd`,
>   `approve` dengan `signer_id` (via `SubmissionService`), lalu langkah
>   "unggah surat ber-TTE" yang direplikasi dari `TteController::uploadAcceptance`
>   (`waiting_tte → ongoing`) sebelum `needsCertificate`. Menolak status di luar
>   alur (mis. `completed`, `rejected`).
> - **R4a** — `DemoSpectrumSeeder` (OPD demo `DEMO` + kop + penandatangan,
>   1 verifikator + 1 admin OPD demo, 3 tiket: `MGG-2026-900101` Menunggu TTE,
>   `MGG-2026-900102` Perlu Sertifikat, `MGG-2026-900103` Perlu Keputusan).
>   Idempoten. **Tidak** di `DatabaseSeeder`; manual: `php artisan db:seed
>   --class=DemoSpectrumSeeder`. `DemoTransitionCommand` (`magang:demo-status
>   {tiket} {status}`) menggerakkan tiket ke status demo; diblokir di produksi
>   (`app()->isProduction()` → FAILURE). Keduanya lewat `DemoStatusService`,
>   jadi data demo punya status-log, snapshot penandatangan, dan draft PDF.
>   Catatan guard: di command dipakai cek produksi (bukan `abort()` HTTP) agar
>   konsisten dengan gaya command lain di repo.
> - **R4b** — `resources/js/lib/internship-progress.ts` memuat `classifyProgress`
>   (prioritas: completed → selesai, `end < hari ini` + non-selesai → lewat_batas,
>   `start > hari ini` → belum_mulai, sisanya aktif), `calcProgressPct`,
>   `PROGRESS_META` (label + warna per state), dan `progressA11y`
>   (role=progressbar + aria-valuenow/min/max + label teks). Komponen bersama
>   `resources/js/components/progress-bar.tsx` dipakai di kartu + kepala dialog
>   `opd/peserta.tsx`, kolom tabel `opd/dashboard.tsx` & `verifikator/dashboard.tsx`,
>   dan kartu progres `mahasiswa/dashboard.tsx` (status aktif/penyelesaian).
>
> - **Tes R4:** `tests/Feature/Feature/Penyelesaian/DemoStatusTest.php` — 9 tes
>   (status ketiga tiket, idempotensi seeder, snapshot/draft/status-log, pergerakan
>   command, status/tiket tidak dikenal, guard produksi, aktor demo, role).
> - **Catatan cakupan:** tidak ada framework unit-test frontend (vitest) di repo,
>   jadi R4b diverifikasi via tsc · eslint · prettier · build, bukan unit test.

---

## R5 — Dokumentasi instalasi & seeder ✅ SELESAI 2026-08-06

> **Hasil:** keempat sub-item jalan; penanda ini menyusul (kodenya sudah ter-commit
> lebih dulu, headingnya baru ditandai 2026-08-07).
>
> - **R5a** — `.env.example` ada & tracked, disusun dari `config/*.php` + CLAUDE.md
>   (bukan salinan `.env` asli). `APP_URL=http://localhost:8000` berskema,
>   `APP_TIMEZONE=UTC` + `APP_SCHEDULE_TIMEZONE=Asia/Jakarta`, `DB_CONNECTION=pgsql`,
>   `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `FILESYSTEM_DISK=local`,
>   `MAIL_*` menunjuk Mailpit lokal (1025), `RECAPTCHA_*` kosong.
> - **R5b** — `README.md` ada & tracked: prasyarat, instalasi manual (karena
>   `composer setup` rusak), DB `magang_test`, `wayfinder:generate` sebelum
>   `types:check`/`build`, `composer dev` + konsekuensi worker antrean, SMTP lokal,
>   akun seeder, tabel perintah harian.
> - **R5c** — `OpdSeeder::siapkanSurat()` mengisi `letterhead_address/phone/email`
>   **dan** satu `OpdSigner` utama per OPD (jabatan diturunkan dari nama OPD,
>   NIP contoh unik). Sengaja hanya mengisi yang kosong supaya seeder yang
>   dijalankan ulang tidak menimpa data yang sudah diedit lewat Kelola Surat.
>   Dampak: instalasi baru langsung bisa meng-ACC pengajuan (gate TTE terpenuhi).
> - **R5d** — `ngrok.bat` sudah masuk `.gitignore`. **Rotasi authtoken-nya tetap
>   tugas pemilik repo** — file-nya pernah ada di working tree dengan token asli.
>   Dua berkas `*.patch` di root belum dikonfirmasi, dibiarkan apa adanya.

> Revisi: lengkapi `.env.example` / README (instalasi, SMTP lokal, konfigurasi
> database) dan seeder untuk mengisi data Admin & OPD.

### R5a — `.env.example`
Belum ada sama sekali → `composer setup` mati di langkah `copy('.env.example', '.env')`.
Isi disusun dari `config/*.php` + CLAUDE.md, **bukan** disalin dari `.env`
(berisi rahasia asli; `.claude/settings.json` juga melarang membacanya).
Kunci minimal: `APP_NAME/ENV/KEY/DEBUG/URL` (**URL wajib berskema**),
`APP_TIMEZONE=UTC` (jangan diubah) + `APP_SCHEDULE_TIMEZONE=Asia/Jakarta`,
`DB_*` (pgsql), `SESSION_DRIVER=database`, `QUEUE_CONNECTION`,
`FILESYSTEM_DISK=local`, `MAIL_*`, `RECAPTCHA_SITE_KEY/SECRET` (boleh kosong).

### R5b — `README.md`
Berisi: prasyarat (PHP 8.3+, PostgreSQL, Node), langkah instalasi manual
(karena `composer setup` rusak), **buat DB `magang_test` untuk tes**,
`php artisan wayfinder:generate --with-form` sebelum `types:check`/`build`,
`composer dev` (server + worker antrean `emails` + Vite) dan konsekuensi bila
worker tidak jalan, konfigurasi SMTP lokal (Mailpit/Mailtrap), akun hasil seeder,
serta tabel perintah harian.

### R5c — Seeder
`OpdSeeder` + `AdminSeeder` sudah ada dan sudah memenuhi permintaan (1 verifikator
+ 1 admin per OPD). Yang perlu **ditambahkan**: seed `letterhead_address/phone/email`
dan **minimal satu `OpdSigner`** per OPD. Tanpa itu, instalasi baru tidak bisa
meng-ACC satu pengajuan pun (gate approve menolak) — jebakan onboarding yang
persis sama dengan penyebab 4 tes merah di [P0](#p0--prasyarat-kembalikan-suite-ke-hijau).

### R5d — Higiene repo (temuan sampingan)
- `ngrok.bat` (untracked) memuat **authtoken ngrok asli** → masukkan ke
  `.gitignore` dan rotasi tokennya.
- `0001-UWES-ALL.patch` / `UWES_ALL_7c798ac.patch` di root: tak dirujuk apa pun —
  konfirmasi apakah masih dibutuhkan.

**Ukuran:** S–M. **Risiko rendah, dampak besar untuk demo & penilaian mentor.**

---

## Urutan & Batch

| Batch | Isi | Alasan urutan |
| --- | --- | --- |
| **A** ✅ | P0 (4 tes) + R5 (env, README, seeder kop+penandatangan) | Hijaukan gate & buat instalasi bersih bisa dipakai. Seeder penandatangan juga menghapus akar masalah P0. |
| **B** ✅ | R1 + R2a + R2b | Semuanya menyentuh `opd/peserta.tsx` + `verifikator/users/index.tsx`; dikerjakan sekali jalan agar tidak konflik. |
| **C** ✅ | R2c (satu magang aktif) | Berdiri sendiri (request + service + tes). Bisa paralel dengan B kalau dikerjakan orang lain. |
| **D** ✅ | R3 (surat) | Paling besar & paling berisiko (migration + snapshot + 4 view PDF). Butuh baseline hijau dari A. |
| **E** ✅ | R4 (simulasi + progres) | Bergantung pada D untuk data demo TTE yang realistis. |

Setelah tiap batch: `composer ci:check` + `npm run build`, lalu perbarui
`prompt/CURRENT-SESSION.md` (keputusan & gotcha) dan CLAUDE.md bila ada invarian baru.

---

## Keputusan yang masih terbuka

Enam hal di bawah mengubah hasil akhir secara material. Jawaban dibutuhkan
sebelum batch yang bersangkutan dimulai (bukan sebelum seluruh rencana jalan).

1. **"Jam selesai" presensi.** Sistem sekarang hanya punya jam masuk
   (`created_at`); `end_time` warisan selalu null. Pilihan:
   **(a)** tampilkan "—" untuk jam selesai *(rekomendasi: paling murah, tidak
   mengubah invarian absen harian)*; **(b)** tambah aksi "Selesai Kegiatan"
   (`POST presensi/{log}/selesai`) yang mengisi `end_time` — ini **mengubah
   aturan bisnis presensi** dan butuh perubahan di halaman mahasiswa. → *Batch B*
2. **Larangan mendaftar setelah `completed`.** Dibaca harfiah: sekali selesai,
   email itu tidak boleh mendaftar selamanya. Apakah itu memang yang diinginkan,
   atau boleh mendaftar lagi di periode/tahun berikutnya? → *Batch C*
   **MASIH TERBUKA per 2026-08-06 — sengaja ditunda oleh pemilik.** Batch C
   sudah selesai dengan perilaku **larangan permanen** (kode + tes
   `SatuMagangAktifTest` mengunci itu), tapi keputusannya belum final. Bila
   nanti dijawab "boleh daftar lagi tahun berikutnya", yang berubah:
   `StoreApplicationRequest::after()`, guard `completed` di
   `SubmissionService::submit()`/`::resubmit()`, dan dua tes alumni.
3. **Privasi dossier antar-OPD.** Bolehkah Admin OPD melihat riwayat pengajuan
   peserta ke **OPD lain** (tiket, status, periode, nama OPD)? Verifikator jelas
   boleh. Rekomendasi: tampilkan, tanpa dokumen/berkas. → *Batch B*
4. **Nomor surat per OPD.** ✅ **DIJAWAB 2026-08-07: per OPD, kerjakan sekarang.**
   Sebelumnya `SkNumberService` memakai **satu** counter global dengan format
   `503.11/N/401.106/TAHUN` (`401.106` = kode Kominfo). Implementasi Batch D:
   kolom `letter_code` di `opds` (default `401.106`) + counter per OPD di
   `sk_counters` (`key` = `acceptance:{opd_id}`), sehingga tiap OPD punya urutan
   sendiri. → *Batch D*
5. **Penandatangan surat penyelesaian.** ✅ **DIJAWAB 2026-08-07: snapshot sendiri.**
   Kolom `completion_signer_*` di `final_reports`, diisi **sekali** saat surat
   dibuat dari penandatangan utama OPD saat itu — konsisten dengan pola snapshot
   surat penerimaan & sertifikat, dan tetap benar bila pimpinan berganti. → *Batch D*
6. **Rentang presensi di dialog.** Default 31 hari (sekarang) dengan opsi
   90 hari / semua, atau langsung seluruh riwayat? Rekomendasi: default 31 +
   opsi, agar payload halaman tidak membengkak. → *Batch B*

---

## Catatan risiko

- **`opd/peserta.tsx` (1214 baris) dan `opd/dashboard.tsx` (1949)** — R1/R2 menyentuh
  keduanya. Satu-satunya ekstraksi komponen yang direncanakan adalah
  `presensi-history.tsx` (sudah terduplikasi di dua halaman). Selebihnya diedit di tempat.
- **Snapshot penandatangan** — menambah kolom snapshot tanpa mengisi baris lama
  itu benar dan disengaja; view PDF harus tahan `null` (dokumen pra-fitur).
- **Status VARCHAR, bukan enum DB** — status baru tidak butuh migration, tapi
  jalankan tes di PostgreSQL (bukan SQLite) supaya kelas bug CHECK-constraint
  2026-07-30 tidak terulang.
- **Gate approve** — jangan dilonggarkan demi seeder/tes/demo; lengkapi kop +
  penandatangannya.
- **`resources/js/lib/opd-readiness.ts`** dipakai `opd/keputusan.tsx` **dan**
  `DecisionDialog` di `opd/dashboard.tsx`; kalau R3 mengubah syarat kesiapan OPD,
  kedua pemakai itu ikut berubah atau aturannya bercabang.
