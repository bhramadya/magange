# CURRENT SESSION — E-Magang Kota Madiun

**Tanggal mulai:** 2026-07-16
**Status:** 🟡 In Progress

## Batch aktif
Prompt yang sedang dikerjakan: lihat `claude-prompts/QUEUE/2026-07-16-batch.md`

## Sudah selesai
- [x] 01 — OTP expiry 10 menit → 5 menit (OtpService TTL_MINUTES, mail otp.blade.php, OtpServiceTest — 6 tes lulus)
- [x] 02 — Autofocus kolom OTP pertama (autoFocus di input index 0; efek fokus-saat-step-code sudah ada sebelumnya)
- [x] 08 — Intervention Image (v4.2, app/Services/ImageService.php: scaleDown 1000px + JPEG q80, fallback simpan asli bila GD/Imagick tak ada) + validasi ukuran: surat_pengantar/cv 2MB (dari 5MB), portofolio tetap 10MB — backend (StoreApplicationRequest) & frontend (welcome.tsx, pesan "Ukuran file maksimal 2MB/10MB") + 3 tes ukuran baru
- [x] 07/06/05/11 — Audit kelengkapan data dari form-pendaftaran. Temuan & perbaikan (semua frontend; backend resource sudah lengkap):
  - Komponen baru `resources/js/components/application-documents.tsx` — chip tautan Surat Pengantar/CV/Portofolio (route terproteksi pengajuan.dokumen), dipakai keempat halaman admin.
  - `types/magang.ts`: tambah `surat_pengantar_url`/`cv_url`/`portfolio_url` (sebelumnya prop backend ini tak bertipe & tak pernah dirender); `skills` jadi `string | null`.
  - `verifikator/masuk.tsx`: panel tinjau sebelumnya TANPA identitas pemohon — kini tampil pas foto, NIS/NIM, nama, alamat, WA/email pemohon, WA pembimbing & penanggung jawab, + berkas; submit setTimeout diganti router.post forward/reject nyata + tampilan error.
  - `opd/keputusan.tsx`: sama — identitas + foto + berkas ditambah; submit setTimeout diganti router.post approve/reject nyata + tampilan error.
  - `verifikator/dashboard.tsx` & `opd/dashboard.tsx` (dialog tinjau/detail): tambah No. WA Pembimbing, No. WA Penanggung Jawab, dan berkas pendukung.
  - Role rule terjaga: form verifikator tetap hanya OPD Tujuan + Catatan Khusus; form approve OPD tetap Divisi/Pembimbing Lapangan/Penanggung Jawab.
  - Gate: tsc ✅, eslint ✅, prettier ✅, tes Feature Verifikator+Opd 17 lulus (135 assertion).
- [x] 03 — Kelola Kuota OPD → Kelola OPD (CRUD penuh, mirror pola Verifikator\FaqController):
  - Backend: `Verifikator\OpdController` (index/create/store/edit/update/destroy) + FormRequest `StoreOpdRequest`/`UpdateOpdRequest` (kode unik, kuota min = kuota_used) di bawah `verifikator/opd/*` (role:admin_verifikator). Hapus ditolak (flash error) bila kuota_used > 0.
  - `OpdResource` ditambah `description` + `is_active` (aditif — kontrak prop lama utuh); tipe `Opd` di magang.ts ikut.
  - Frontend: `pages/verifikator/opd/{index,create,edit}.tsx` mirror pola FAQ; sidebar verifikator kini "Kelola OPD" → `/verifikator/opd`. Halaman & route lama `/verifikator/kuota` + `PATCH /kuota/{opd}` DIPERTAHANKAN (dipakai Admin OPD di dasbornya + tes lama).
  - Tes: `tests/Feature/Feature/Verifikator/OpdControllerTest.php` — 8 tes (list, create+kuota_used 0, kode unik, update, kuota < terpakai ditolak, delete kosong OK, delete berisi ditolak, 403 untuk admin OPD).
- [x] Lockout progresif OTP (Fibonacci) [batch #6]: 3x salah input → token aktif diinvalidasi (wajib kirim ulang) + jeda kirim ulang naik per tingkat lockout 1,1,2,3,5,8… menit. Reset saat login sukses ATAU 24 jam tanpa percobaan (dicek saat baca, tanpa cron).
  - Tabel/model baru `otp_lockouts`/`OtpLockout` (1 baris per user), service baru `app/Services/OtpLockoutService.php`, kontrak `OtpServiceContract` ditambah `invalidateActiveTokens()`, wiring di `OtpLoginController` (send & verify diblokir saat terkunci; pesan error Indonesia menyebut sisa waktu).
  - Frontend `auth/otp-login.tsx`: prop flash `lockoutSeconds` → hitung mundur live "Coba lagi dalam X menit Y detik"; tombol kirim/verifikasi/kirim-ulang dinonaktifkan selama lockout. (Pola sync prop→state pakai "adjust state during render", bukan useEffect — aturan eslint react-hooks/set-state-in-effect.)
  - Tes: `tests/Unit/OtpLockoutServiceTest.php` (6 tes — deret Fibonacci, ambang 3x, eskalasi tingkat, reset manual & idle 24 jam) + 4 tes feature di OtpLoginControllerTest (termasuk prop lockoutSeconds). Lockout independen dari expiry OTP 5 menit — tes "setelah jeda habis, login normal" membuktikan keduanya bekerja bersama.
  - Gate penuh: Pint ✅, PHPStan ✅ (perlu `--memory-limit=1G`, limit default 128M di php.ini lokal kurang), Pest 135 lulus / 10 skip (721 assertion), tsc/eslint/prettier ✅, vite build ✅.

## Sedang dikerjakan
- (kosong — semua item batch 2026-07-16 selesai)
- [ ] NEW — Progressive Fibonacci lockout OTP: 3x salah input → wajib kirim ulang, jeda kirim ulang naik deret Fibonacci (1,1,2,3,5,8... menit), reset counter kalau login sukses ATAU 24 jam tanpa percobaan (mana duluan)


## Keputusan / catatan penting
- Kontrak prop path dari HANDOFF-BACKEND.md tidak boleh berubah kecuali dicatat eksplisit di sini.
- Role rule tetap: Admin Verifikator hanya isi "Catatan Khusus Admin Verifikator", tidak boleh isi Divisi/Pembimbing Lapangan/Penanggung Jawab.
- PHP lokal TIDAK punya ekstensi GD/Imagick → ImageService fallback ke penyimpanan asli; di server produksi pastikan GD terpasang agar kompresi aktif. Tes yang butuh GD (`UploadedFile::fake()->image()`) diganti `create(..., 'image/jpeg')`.
- Perbaikan PHPStan pre-existing ikut dibereskan: nullsafe pada start_date/end_date (NOT NULL di DB) dan guard null file_path di Verifikator\ReportController.

## Next step
- BATCH BERIKUTNYA (belum dikerjakan, rencana sudah disetujui user 2026-07-20):
  `prompt/QUEUE/2026-07-20-batch-5-revisi.md` — 5 revisi: (1) tag OPD sinkron
  (landing render dari description + TagEditor di dasbor OPD), (2+4) menu
  Laporan verifikator pindah TOTAL ke OPD "Kelola Peserta" (opd/laporan/*,
  ownership guard) + audit alur penyelesaian, (3) dialog detail user di
  Kelola User, (5) presensi jadi absen harian (status hadir/izin/sakit,
  tanggal otomatis, 1x/hari, Dokumentasi Foto wajib 1-3 @2MB, export di
  header riwayat + search + dialog detail, admin lihat presensi di dialog
  detail Kelola Peserta/Kelola User). Keputusan user sudah final di file itu.

## Blocker
- (belum ada)
## Batch 2026-07-18 — new_revisi.txt (15 revisi, FRONTEND ONLY)
Backend dikerjakan rekan; prompt/kontrak lengkap di
`resources/js/pages/catatan_backend_newrevisi.txt`. Checklist di bawah 15
revisi di `resources/js/pages/new_revisi.txt` (semua [x] kecuali R4/R7 yang
murni backend). Ringkasan yang dikerjakan:
- [x] R1 — NIM alfanumerik maks 15 (welcome.tsx).
- [x] R2+R8 — reCAPTCHA v2 checkbox → v3 invisible: hook baru
  `hooks/use-recaptcha-v3.ts`; dipakai welcome.tsx,
  components/landing/registration-form.tsx (komponen lama ikut dimigrasi
  agar tsc lulus — deklarasi global grecaptcha bentrok), auth/otp-login.tsx
  (action otp_send), auth/admin-login.tsx (action admin_login). Field tetap
  `recaptcha_token`, pola useForm `transform()` sebelum post.
- [x] R3 — vendor/mail header pakai /images/Lambang_Kota_Madiun.png; badge
  email konfirmasi "Menunggu Verifikasi" + teks "Sedang menunggu verifikasi admin".
- [x] R5 — sk_number/sk_issued_at (+completion_sk_*) di types/magang.ts,
  info-box di opd/keputusan.tsx, DetailRow SK di opd/dashboard.tsx & peserta.tsx.
- [x] R6 — opd/peserta.tsx dialog detail lengkap: semua field identitas,
  foto (photo_url), ApplicationDocuments, timeline StatusTimeline
  (status_logs; fallback dari forwarded_at/opd_decision_at bila prop belum ada).
- [x] R9 — verifikator/reports/index.tsx: CompletionLetter (POST generate /
  GET unduh surat-penyelesaian, tampil No. SK + tanggal statis).
- [x] R10 — komponen `generated-credentials-dialog.tsx` (flash
  generatedCredentials), tombol Reset Password di Kelola OPD, halaman
  `auth/force-password.tsx` (layout null di app.tsx), welcome.tsx merender
  daftar OPD dari prop `opds` bila non-empty (statis = fallback + kamus tag).
- [x] R11 — kode_opd (angka) + inisial_opd di opd create/edit/index.
- [x] R12 — `verifikator/users/index.tsx` (search server-side ?search=
  debounce, toggle-active) + nav "Kelola User".
- [x] R13 — `verifikator/admins/index.tsx` (form tambah inline tanpa input
  password, reset password, hapus dengan guard self) + nav "Kelola Admin".
- [x] R14 — search ditambah di verifikator/opd/index & faq/index (client-side);
  reports sudah punya.
- [x] R15 — mahasiswa/pengajuan.tsx: Ajukan Ulang → POST
  /mahasiswa/pengajuan/{id}/ajukan-ulang, onError fallback /#daftar.
- Gate: tsc ✅, eslint ✅ (eslint.config.js: `.agents/**` masuk ignores —
  direktori tooling OpenCode ber-error lint pre-existing; fitur landing
  features.tsx unused import Building2 dibersihkan), prettier ✅.
- Kontrak prop-path HANDOFF-BACKEND.md tetap utuh (penambahan aditif saja).

## Batch 2026-07-19 — BACKEND new_revisi (R1-R15) + revisi tertinggal #16-23
Dikerjakan Claude Code. Semua kontrak catatan_backend_newrevisi.txt dipenuhi
persis (nama route/prop/kolom). Ringkasan:
- [x] #16 — guardian_name/guardian_whatsapp DI-DROP (migration 000100) dari DB,
  request, service, resource, email, seeder, 6 halaman React, types/magang.ts.
  PENTING: form pendaftaran sebelumnya RUSAK (backend wajibkan guardian yang
  tak lagi dikirim frontend) — kini sinkron.
- [x] R1 — nis alfanumerik max:15 + regex + pesan Indonesia.
- [x] R2/R8/#20 — Recaptcha v3 (score >= services.recaptcha.min_score, action
  match opsional) di pendaftaran/otp-send/admin-login; kunci hanya via config.
- [x] R4/R5 — sk_number+sk_issued_at (set SEKALI di approve, idempoten),
  SkNumberService + tabel sk_counters (lockForUpdate, format
  503.11/N/401.106/TAHUN), PATCH verifikator/sk-counter (start number),
  PDF acceptance_letter kop Kominfo + logo (skip logo bila GD absen).
- [x] R9 — completion_sk_* + completion_letter_path di final_reports,
  POST/GET verifikator/laporan/{report}/surat-penyelesaian (idempoten),
  view pdf/completion_letter.blade.php.
- [x] R10 — AdminAccountService (Str::password(12), must_change_password),
  OpdController@store buat akun admin_opd + flash generatedCredentials
  (shared prop baru di HandleInertiaRequests: success/error/
  generatedCredentials), POST verifikator/opd/{opd}/reset-password,
  middleware password.changed (global web) + Auth\ForcePasswordController
  (GET/POST admin/password-baru), last_login_at di Fortify + OTP login.
- [x] R12 — Verifikator\UserController (?search= ilike nama/email, paginate,
  applications_count) + PATCH toggle-active; akun nonaktif ditolak di OTP
  send DAN verify.
- [x] R13 — Verifikator\AdminController (store tanpa input password,
  reset-password, destroy dengan guard hapus-diri-sendiri).
- [x] R11 — opds.kode_opd (int unique) + inisial_opd; code lama tetap.
- [x] R15/#23 — SubmissionService::resubmit (guard rejected+milik, tiket baru,
  replicate + copy fisik berkas ke applications/resubmit/{tiket}/, opd_id
  dikosongkan, log "Diajukan ulang dari X", email konfirmasi) + route
  POST mahasiswa/pengajuan/{application}/ajukan-ulang.
- [x] R6 — opd/peserta: status_logs (whenLoaded statusLogs+changedBy di
  InternshipApplicationResource) + semua field resource terkirim.
- [x] R14 — reports index ?search= (tiket/nama/instansi) + filters.search.
- [x] #22 — presensi_logs + presensi_attachments (multiple, disk privat),
  Mahasiswa\PresensiController (index prop entries/store/attachment/destroy),
  presensi.tsx disambungkan (riwayat + export semua entri + kirim lampiran
  via transform), nav "Presensi Harian".
- [x] R7 — middleware global SanitizeInput (script/on*=/javascript: dibuang,
  password dikecualikan, strip & tanda baca lolos). Tes: script bersih,
  "D-3 Teknik" utuh.
- [x] #17/#18/#19/#21 — diverifikasi SUDAH ada sebelumnya (teks antispam tak
  ditemukan; testimoni HomeController+welcome; foto via route ter-auth; label
  "Tag/tambahkan tag" di form OPD; kuota.update sudah 2 role).
- Perbaikan test-harness: phpunit.xml APP_URL=http://localhost (APP_URL .env
  tanpa skema merusak URL test → 404 massal PRE-EXISTING), TestCase
  withoutVite() (tak butuh manifest build).
- Tes baru: Verifikator/{AccountManagementTest(10),SkNumberTest(4)},
  Mahasiswa/{ResubmitTest(3),PresensiTest(5)}, Security/SanitizeInputTest(2).
- Gate penuh: Pint ✅ PHPStan ✅ Pest 159 lulus/10 skip ✅ tsc ✅ eslint ✅
  prettier ✅ vite build ✅.
- [x] Bug masalah.txt (2026-07-20): #1 hitungan dasbor verifikator ≠ halaman
  masuk → akar: recentApplications limit(50), dihapus; tombol aksi tabel kini
  ikut status (Tinjau/Selesaikan/Detail). #2 card OPD sudah beres di batch
  frontend sebelumnya (5 card seurutan filter) — diverifikasi saja.
  Gate ulang: Pint/PHPStan/Pest 159 ✅ tsc/eslint/prettier ✅.
