# Rencana: 5 Revisi — Tag OPD, Penyelesaian→OPD, Detail User, Presensi Absen

## Konteks
Lima revisi lanjutan pada E-Magang Kota Madiun. Keputusan user: foto presensi 1–3 @2MB; presensi 1x/hari; presensi admin tampil di dialog detail yang sudah ada; menu Laporan pindah **total** ke OPD.

Temuan eksplorasi kunci:
- Tag OPD "belum sinkron" karena `welcome.tsx` merender tag dari kamus hardcode `tagsByName` (per nama OPD), bukan dari kolom `opds.description` yang diedit verifikator. Dasbor OPD hanya punya `QuotaEditor` (inline edit, PATCH kuota/{opd}) tanpa edit tag.
- `CertificateService::uploadCertificate` sudah role-agnostic (`uploaded_by` = actor) — aman dipakai admin OPD.
- `opd/peserta.tsx` sudah punya `DetailDialog` + `StatusTimeline` + blok Laporan Akhir read-only + `CompleteAction`; tinggal ditambah aksi review/sertifikat/surat (port dari `verifikator/reports/index.tsx`).
- `verifikator/users/index.tsx` berupa list kartu tanpa dialog detail; pola dialog bisa ditiru dari `opd/peserta.tsx`.
- Frontend memanggil route dengan string literal — pemindahan route = ganti prefix string.

## 1. Tag OPD sinkron (label + landing + dasbor OPD)
- **welcome.tsx**: render tag dari `real.description` (split koma, trim, buang kosong); fallback ke `tagsByName`/default hanya bila description kosong. (Cek juga `components/landing/opd-directory.tsx` bila dipakai welcome — samakan.)
- **verifikator/opd/index.tsx** + **kuota.tsx**: pastikan label kolom/teks yang masih "Deskripsi" menjadi "Tag" (create/edit sudah benar).
- **Dasbor OPD** (`opd/dashboard.tsx`): tambah `TagEditor` inline di samping/bawah `QuotaEditor` (pola sama persis: state editing/value/error, `router.patch`).
- **Backend**: route baru `PATCH opd-tag/{opd}` → method baru di `OpdQuotaController` (atau `updateDescription`) dengan FormRequest baru `UpdateOpdTagRequest` — authorize meniru `UpdateQuotaRequest` (verifikator semua, admin_opd hanya miliknya), rules `description nullable string max:1000`. Kirim `description` di prop `opd` dasbor (OpdResource sudah memuatnya).

## 2 + 4. Penyelesaian magang pindah ke OPD ("Kelola Peserta") + audit sinkronisasi
- **Routes**: hapus blok `verifikator/laporan/*`; buat blok `opd/laporan/*` (middleware `role:admin_opd`, name `opd.laporan.`) berisi: GET `{report}/berkas`, POST `{report}/approve`, POST `{report}/sertifikat`, POST+GET `{report}/surat-penyelesaian`. (GET index tidak perlu — datanya lewat halaman peserta.) Controller baru `Opd\ReportController` = pindahan logika `Verifikator\ReportController` (approve/uploadCertificate/generateCompletionLetter/downloadCompletionLetter/downloadReport) + **guard kepemilikan**: `abort_unless($report->application->opd_id === $request->user()->opd_id, 403)` di setiap aksi. `Verifikator\ReportController` + halaman `verifikator/reports/index.tsx` dihapus. PATCH `verifikator/sk-counter` TETAP milik verifikator.
- **Nav** (`magang-layout.tsx`): hapus item `laporan` dari `verifikatorNav`; ganti judul item `peserta` di `opdNav` → "Kelola Peserta".
- **Payload**: di `Opd\DashboardController@peserta`, `final_report` di `InternshipApplicationResource` perlu tambahan aditif: `id`, `report_url` (route opd.laporan.berkas), `completion_sk_number`, `completion_sk_issued_at`, `completion_letter_available`. Tipe `FinalReport` di `types/magang.ts` ikut.
- **opd/peserta.tsx** (judul halaman → "Kelola Peserta"): di `DetailDialog`, blok Laporan Akhir read-only diperluas jadi panel aksi (port dari reports/index.tsx): link buka berkas, tombol "Setujui Laporan" (status pending), `UploadCertificate` (status approved, PDF), `CompletionLetter` (generate/unduh, nomor SK statis) — semua ke prefix `/opd/laporan/{id}/...`.
- **Audit sinkronisasi penyelesaian** (poin 2): telusuri alur ongoing → completion_submitted → completed end-to-end setelah pemindahan: `Mahasiswa\ReportController@store` (complete saat is_confirmed), `SubmissionService::complete` (4 aktor), cron `magang:transition-statuses`, `CertificateService::unlock` via survei, halaman `mahasiswa/penyelesaian`. Perbaiki yang putus — minimal yang sudah ketahuan: setelah route pindah, semua referensi `/verifikator/laporan` di frontend/tes mati; verifikator `riwayat`/dashboard tetap bisa menandai selesai (complete) — itu tetap.
- **Tes**: pindahkan/duplikasi tes CompletionFlowTest, EndToEndFlowTest, SkNumberTest bagian laporan ke actor admin OPD (route baru + ownership: admin OPD lain → 403). Verifikator kini TIDAK boleh akses (assert 403).

## 3. Detail user di Kelola User (verifikator)
- **Backend** (`Verifikator\UserController@index`): tambahkan per user (aditif): `avatar_url` (null-safe), dan `applications: [{ticket_number, status, opd_name, institution_name, created_at}]` (relasi applications + opd, terbaru dulu), plus `presensi_count`.
- **Route baru** GET `verifikator/users/{user}/presensi` → JSON/Inertia partial? Lebih sederhana: sertakan ringkasan presensi terakhir (≤30 entri: tanggal, status, jam absen) langsung di payload index? Itu berat. **Pilihan**: endpoint GET `verifikator/users/{user}/detail` men-return props lewat dialog lazy? Untuk kesederhanaan Inertia: muat `applications` (ringan) langsung di index; presensi dimuat terpisah via `router.get` dengan query `?user={id}` — TIDAK. Keputusan final: payload index memuat `applications` (max 5 terakhir) dan `presensi` (max 31 hari terakhir) hanya berupa ringkasan kecil — masih ringan untuk 15 user/halaman.
- **Frontend** (`verifikator/users/index.tsx`): kartu jadi clickable → `UserDetailDialog` (pola DetailDialog peserta.tsx): identitas (nama, email, WA, status aktif, last_login, terdaftar), daftar pengajuan (tiket + status + OPD), riwayat presensi (tanggal, badge hadir/izin/sakit, jam absen, klik lampiran → link route lampiran admin, lihat #5).

## 5. Presensi → absen harian (hadir/izin/sakit + foto)
- **Migration** (ubah `presensi_logs`): tambah `status` string (hadir|izin|sakit, default hadir); jadikan `start_time`/`end_time` nullable (data lama tetap; entri baru tak mengisinya); tambah **unique(user_id, activity_date)** → 1x per hari. Jam absen = `created_at`.
- **StorePresensiRequest**: field jadi `status in:hadir,izin,sakit` (required), `details` required, `attachments` **required array min:1 max:3**, `attachments.*` `image mimes:jpeg,jpg,png max:2048`. `activity_date` TIDAK dari input — controller set `today()`. Tolak duplikat hari yang sama dengan pesan "Anda sudah presensi hari ini." (cek exists sebelum create; pesan error di field `status`).
- **PresensiController** (mahasiswa): `index` kirim `entries` dengan bentuk baru: `{id, activity_date, status, checked_in_at (created_at ISO), details, attachments[]}` + `hasToday: bool`; `store` set tanggal otomatis; `attachment`/`destroy` tetap.
- **Route admin lampiran**: lampiran presensi kini juga harus bisa dibuka admin → longgarkan route `presensi/{log}/lampiran/{attachment}` menjadi role `mahasiswa,admin_verifikator,admin_opd` dengan otorisasi di controller: pemilik ATAU verifikator ATAU admin OPD yang punya aplikasi aktif user tsb (`opd_id` cocok pada pengajuan user).
- **presensi.tsx** rombak:
  - Form: hapus 3 kolom tanggal/jam; tambah select "Status Kehadiran" (Hadir/Izin/Sakit) di atas Rincian Aktivitas; blok lampiran → "Dokumentasi Foto" (accept image, min 1 max 3, teks "1–3 foto, maks 2MB/foto"); bila `hasToday` form diganti banner "Anda sudah presensi hari ini ✓".
  - Tombol Export Excel/Word pindah ke header card "Riwayat Presensi" (kanan judul).
  - Riwayat: tambah input search (client-side: tanggal/status/rincian); tiap entri clickable → dialog detail (tanggal, badge status, "Absen pukul HH:MM", rincian, grid foto); kolom export baru: Tanggal, Status, Jam Absen, Rincian.
- **Admin melihat presensi**: 
  - OPD `opd/peserta.tsx` DetailDialog: seksi "Riwayat Presensi" (data dari payload peserta — `Opd\DashboardController@peserta` sertakan `presensi` ringkas dari user pemilik aplikasi, mis. 31 entri terakhir).
  - Verifikator: di UserDetailDialog (poin 3).

## Urutan pengerjaan
1. Migration presensi + Tag endpoint (kecil, independen)
2. Poin 1 tag (backend+frontend+landing)
3. Poin 4 pemindahan laporan → OPD + poin 2 audit (terbesar)
4. Poin 3 detail user
5. Poin 5 presensi overhaul (backend lalu frontend)
6. Tes: update tes lama (route pindah), tes baru (tag, ownership OPD laporan, presensi 1x/hari + foto wajib, akses lampiran admin), lalu gate penuh `composer ci:check` + `npm run build`.
7. Update CLAUDE.md ringkas + prompt/CURRENT-SESSION.md.

## Verifikasi
- `php artisan test` penuh (termasuk EndToEndFlowTest yang diarahkan ulang ke aktor OPD).
- Manual cepat via tinker/route:list: pastikan tidak ada lagi route `verifikator/laporan*`; `opd/laporan/*` menolak OPD lain (403).
- tsc + eslint + prettier + vite build.
