# Rencana: Backend new_revisi (R1–R15) + revisi tertinggal (#16–23) + keamanan

Keputusan user: kerjakan semua sekaligus; sanitasi XSS pakai middleware sendiri (tanpa package); presensi = tabel + simpan + riwayat sebagai prop; kolom guardian **dihapus total**.

Temuan penting: form pendaftaran saat ini **rusak** — StoreApplicationRequest mewajibkan `guardian_name`/`guardian_whatsapp` tapi welcome.tsx tidak lagi mengirimnya → semua submit gagal validasi. Fase 0 memperbaiki ini.

Sudah selesai (verifikasi saja, tanpa kerja): #18 testimoni (HomeController@testimonials + section welcome), #19 foto privat (photo_url → route ter-auth), #20 config-first (config/services.php sudah jadi satu-satunya pemanggil env()).

Pola wajib diikuti: SubmissionService (DB::transaction + guardStatus + ApplicationStatusLog + dispatch job), controller tipis + FormRequest, disk privat untuk semua upload, tes di tests/Feature/Feature/{Role}/, bahasa Indonesia.

## Fase 0 — Perbaiki form pendaftaran (#16 + R1) [BLOCKER]
1. Migration: drop `guardian_name`, `guardian_whatsapp` dari internship_applications (down() mengembalikannya nullable).
2. StoreApplicationRequest: hapus rule + messages guardian; `nis` → `['nullable','string','max:15','regex:/^[a-zA-Z0-9]+$/']` (alfanumerik, R1).
3. SubmissionService::submit + docblock: hapus guardian. InternshipApplicationResource, model $fillable: hapus guardian.
4. Frontend: hapus tampilan guardian dari verifikator/masuk.tsx, opd/keputusan.tsx, kedua dashboard, opd/peserta.tsx, types/magang.ts; hapus dari template email (application-*.blade.php) & PDF bila ada.
5. #17: teks "validasi antispam" — sudah tidak ada di welcome.tsx (dicek); tandai selesai.
6. Sesuaikan tes yang menyentuh guardian/nis.

## Fase 1 — Kolom users + keamanan login (R10-dasar, R2/R8, #20)
1. Migration users: `must_change_password` boolean default false; `last_login_at` timestamp nullable.
2. **Recaptcha v3** (app/Rules/Recaptcha.php): verifikasi siteverify → terima bila success && score >= `config('services.recaptcha.min_score', 0.5)`; parameter `action` opsional dicocokkan. Tetap skip bila secret kosong. config/services.php: tambah `min_score` (env RECAPTCHA_MIN_SCORE).
3. Terapkan rule: (a) StoreApplicationRequest (sudah, action 'daftar'); (b) SendOtpRequest (action 'otp_send'); (c) admin login — validasi `recaptcha_token` di Fortify::authenticateUsing (action 'admin_login').
4. `last_login_at = now()` di Fortify authenticateUsing + OtpLoginController::verifyOtp.
5. Middleware `EnsureMustChangePassword` (alias `password.changed`) di bootstrap/app.php, dipasang pada grup dasbor admin: must_change_password=true → redirect halaman force-password. Route GET `admin/password-baru` (render auth/force-password) + POST `admin/password-baru` {password, password_confirmation} → simpan, must_change_password=false, redirect dasbor sesuai role.
6. OTP login menolak user `is_active=false` (pesan Indonesia).

## Fase 2 — Kelola akun (R10, R12, R13)
1. Verifikator\OpdController@store: setelah buat OPD, buat User role admin_opd (username dari inisial/kode OPD, password `Str::password(12)`, must_change_password=true), flash `generatedCredentials: {username, password}`. Route POST `verifikator/opd/{opd}/reset-password` (regenerate + flash sama).
2. Verifikator\UserController: GET `verifikator/users` (role mahasiswa, ?search= nama/email server-side, paginate, prop `users` + `filters.search` + applications_count) ; PATCH `verifikator/users/{user}/toggle-active`.
3. Verifikator\AdminController: GET `verifikator/admins` (prop `admins`), POST store (auto-password + flash), POST `{user}/reset-password`, DELETE `{user}` (403/tolak hapus diri sendiri).

## Fase 3 — Kolom OPD baru (R11)
Migration opds: `kode_opd` integer unique nullable + `inisial_opd` string nullable. Store/UpdateOpdRequest + $fillable + OpdResource (aditif). Kolom `code` lama TIDAK dihapus.

## Fase 4 — Nomor SK + surat ber-kop Kominfo (R4/R5, R9)
1. Migration: internship_applications += `sk_number` (string nullable unique), `sk_issued_at` (date nullable); final_reports += `completion_sk_number`, `completion_sk_issued_at`, `completion_letter_path`; tabel `sk_counters` (key unik: 'acceptance' | 'completion', next_number) dengan seeder/opsi start number.
2. Service kecil `SkNumberService` (lockForUpdate pada baris counter, format `NNN/BULAN-ROMawi/KOMINFO/TAHUN` sesuai acuan) — dipanggil dari SubmissionService::approve (idempoten: skip bila sk_number sudah ada) di dalam transaksi yang sama.
3. resources/views/pdf/acceptance_letter.blade.php: redesign kop Kominfo (public/images/Lambang_Kota_Madiun.png, acuan acuan_kopsurat.jpeg) + cantumkan sk_number/sk_issued_at.
4. R9: view pdf/completion_letter.blade.php; Verifikator\ReportController: POST `{report}/surat-penyelesaian` (generate sekali, idempoten) + GET rute sama (stream dari disk privat). Expose field di payload laporan.
5. PATCH `verifikator/sk-counter` (role:admin_verifikator) untuk set start number + kirim nilai sekarang di halaman reports.
6. Expose sk_number/sk_issued_at di InternshipApplicationResource (aditif).

## Fase 5 — Ajukan Ulang (R15/#23)
SubmissionService::resubmit($old): guard status rejected + kepemilikan (policy), transaksi, tiket baru via generateTicketNumber, replicate field form + **copy fisik file** dokumen (path unik), status pending_verifikator, log "Diajukan ulang dari {tiket-lama}", dispatch email konfirmasi. Controller Mahasiswa\ApplicationController@resubmit + route POST `mahasiswa/pengajuan/{application}/ajukan-ulang`.

## Fase 6 — Payload peserta OPD (R6) + search laporan (R14)
1. Opd\DashboardController@peserta: sertakan seluruh field resource + document URLs + relasi statusLogs → prop `status_logs` [{status, note, created_at, actor_name}] urut kronologis.
2. Verifikator\ReportController@index: filter `?search=` (ticket/nama/instansi) + `filters.search`.

## Fase 7 — Kuota & label (#21)
Kuota sudah bisa diubah Verifikator & OPD (kuota.update). Sisanya frontend kecil: ganti teks deskripsi → "tambahkan tag" (halaman kuota/opd).

## Fase 8 — Presensi harian (#22) + Sanitasi XSS (R7)
1. Migration `presensi_logs` (application_id/user_id, activity_date, start_time, end_time, details) + `presensi_attachments` (presensi_log_id, path, original_name) — lampiran multiple ke disk privat.
2. Routes (role:mahasiswa): GET `presensi` (controller kirim `entries` prop → export mencakup semua entri), POST `presensi` (StorePresensiRequest, attachments[]), GET `presensi/{log}/lampiran/{attachment}` (policy pemilik), DELETE opsional. Nav item "Presensi" di mahasiswaNav.
3. Frontend presensi.tsx: sambungkan prop `entries` + daftar riwayat + export iterasi semua entri (perubahan kecil, kontrak form tetap).
4. R7: middleware `SanitizeInput` global (bootstrap/app.php, pola TrimStrings): bersihkan `<script>…</script>`, atribut `on*=`, URI `javascript:` dari semua input string; strip (-) dan tanda baca aman lolos; jangan double-escape. Tes: `<script>alert(1)</script>` bersih, `D-3 Teknik` utuh.

## Fase 9 — Tes + gate + dokumentasi
1. Tes Pest per fitur di tests/Feature/Feature/{Auth,Mahasiswa,Opd,Verifikator,Security}/ + unit SkNumberService. Pola upload: `UploadedFile::fake()->create(..., 'image/jpeg')` (tanpa GD).
2. `composer ci:check` penuh (PHPStan pakai --memory-limit=1G).
3. Update CLAUDE.md (hapus bagian "Frontend ahead of backend" yang sudah selesai, catat guardian dihapus) + prompt/CURRENT-SESSION.md + checklist new_revisi.txt.

Tidak dikerjakan (bukan lingkup): bug dasbor masalah.txt (bisa menyusul), export server-side Word/Excel (export tetap client-side sesuai frontend yang ada).
