# Testing Progress — E-Magang Kota Madiun

**File ini adalah memori lintas-sesi untuk pengujian.** Baca dari atas sebelum melanjutkan.
Update kolom status + "Log Sesi" setiap kali ada item yang selesai diuji.

- Dibuat: **2026-08-05**
- Branch: `newback` (commit terakhir `2db07f0 "done"`)
- Sumber checklist: prompt user 2026-08-05 (10 bagian + 5 prioritas)

## Legend status

| Tanda | Arti |
|---|---|
| `[ ]` | Belum diuji |
| `[~]` | Sebagian / terverifikasi lewat baca kode saja, belum dibuktikan runtime |
| `[x]` | Terverifikasi (ada bukti: test hijau, screenshot, atau output perintah) |
| `[!]` | **Temuan / bug** — ada masalah nyata |
| `[-]` | Tidak berlaku untuk repo ini (lihat alasan) |

---

## 0. Koreksi atas checklist awal (WAJIB dibaca dulu)

Lima klaim di checklist asli **tidak cocok** dengan repo ini. Diverifikasi 2026-08-05:

| Klaim checklist | Kenyataan | Bukti |
|---|---|---|
| "Role & Permission (**Spatie Permission**)" | **Tidak pakai Spatie.** Mekanismenya `app/Enums/UserRole.php` + middleware `EnsureUserRole` (alias `role:`), didaftarkan di `bootstrap/app.php` | `grep spatie/laravel-permission composer.json` → 0 hasil |
| "**5 Jobs, 5 Mailables**" | **7 Jobs**, 5 Mailables | `ls app/Jobs` → GenerateJobAcceptanceLetter, SendApplicationConfirmationJob, SendJobCertificateNotification, SendJobRejectionEmail, SendOtpEmailJob, SendSignedAcceptanceLetterJob, SendSignedCertificateJob |
| "**Belum ada** end-to-end lifecycle test (TODO, prioritas #1)" | **SUDAH ADA** → `tests/Feature/Feature/Penyelesaian/EndToEndFlowTest.php` (7.5KB), plus `CompletionFlowTest.php` + `TransitionTimezoneTest.php` | `ls tests/Feature/Feature/Penyelesaian/` |
| "Re-run **65 test** yang sudah ada" | **36 file test, ~214 blok `it()`/`test()`**. Baseline CLAUDE.md: ~202 tes, **10 skip wajar** (9 fitur Fortify yang sengaja dimatikan + 1 `->skip()` eksplisit) | `find tests -name '*Test.php' \| wc -l` = 36 |
| "**Ticket format mismatch MGG- vs EMG-** → pending decision" | **Tidak ada `EMG-` tersisa** di app/, resources/, tests/, database/, routes/. Format sudah konsisten `MGG-YYYY-NNNNNN`. Tidak ada keputusan produk yang menggantung | `grep -rn "EMG-" app/ resources/ tests/ database/ routes/` → kosong |

**Implikasi:** prioritas #1 ("buat end-to-end test, belum ada sama sekali") berubah jadi
*"baca EndToEndFlowTest yang sudah ada, identifikasi langkah mana yang BELUM dicakup"* —
kandidat yang belum tercakup: registrasi publik lewat form, login OTP nyata, presensi harian, survei kepuasan, unduh sertifikat.

---

## 1. Kondisi lingkungan uji (per 2026-08-05)

| Hal | Nilai | Dampak ke pengujian |
|---|---|---|
| URL publik | `https://tricky-uproot-popper.ngrok-free.dev/` → **200** | Hidup |
| Lokal | `http://localhost:8000/` → **200** (`php artisan serve` pid 14392, `ngrok http 8000` pid 14763) | Hidup |
| `APP_URL` | **`localhost`** — TANPA skema `http://` | URL absolut yang di-generate server (link email) bisa rusak. Bug lama yang sudah tercatat |
| `APP_ENV` / debug | `local` / **debug ON** | Error 500 tampil detail — bagus untuk uji |
| `QUEUE_CONNECTION` | **`sync`** | Job jalan inline. Tak perlu `queue:work`, TAPI **job gagal = error 500 di layar, bukan masuk `failed_jobs`** → checklist §4 "job gagal masuk failed_jobs" hanya bisa diuji dengan `QUEUE_CONNECTION=database` |
| DB | pgsql `magangdb` @127.0.0.1:5432 | Test suite pakai DB terpisah `magang_test` |
| Mail | smtp → **Mailpit** 127.0.0.1:1025, UI **http://localhost:8025** | Email hasil aksi bisa diperiksa langsung |
| **reCAPTCHA v3** | site key + **secret KEDUANYA TERISI** | ⚠️ **BLOKER UTAMA** — aktif di form daftar, kirim OTP, **dan login admin**. Domain ngrok mungkin tak terdaftar di site key → login admin bisa gagal bukan karena kredensial |
| Vite dev server | **TIDAK jalan** | Yang diuji = bundel hasil `npm run build` terakhir. Perubahan frontend baru tak terlihat sampai build ulang |
| Scheduler | **TIDAK jalan** (tak ada `schedule:work`) | Transisi `approved → ongoing` (harusnya 2026-08-01) tak terjadi. Picu manual: `php artisan magang:transition-statuses` |
| `APP_SCHEDULE_TIMEZONE` | `Asia/Jakarta` (`app.timezone` tetap UTC — jangan diubah) | |

### Isi DB saat ini (tipis — batasan nyata untuk pengujian)

- **users: 37** — id 1 `verifikator`, id 2–36 admin OPD (username = slug, mis. `bkd`, `diskominfo`), id 37 mahasiswa `budi.santoso.test@mailnesia.com`. Semua `must_change_password = false`, semua `is_active = true`, password `password`.
- **opds: 35** — semua `quota_total = 10`. Hanya **BKD (id 1)** yang `quota_used = 1` **dan** punya `letterhead_address`. 34 OPD lain letterhead NULL.
- **opd_signers: 1** — hanya milik **BKD** ("Dr Hj Adit", `is_primary`). 34 OPD lain **0 penandatangan** → alur TTE di OPD lain tak bisa diuji tanpa menambah penandatangan lewat UI dulu.
- **internship_applications: 1** — `MGG-2026-0051`, status **`approved`**, **opd_id 1 (BKD)**, periode 2026-08-01 → 2026-10-31, SK `503.11/1/401.106/2026`, draft + signed acceptance path LENGKAP, ada snapshot signer & foto. **Tanpa** surat pengantar/CV.
- **certificates: 0**, **final_reports: 0**, **presensi_logs: 0**, **satisfaction_surveys: 0**, **opd_letter_templates: 0** (pakai default), faqs 6, opd_placement_options 3 (semua BKD), sk_counters 1, otp_tokens 1 (**expired 2026-07-31**), jobs/failed_jobs 0.

> **Akun untuk uji OPD = `bkd` / `password`** (bukan `diskominfo` — OPD itu kosong, tanpa signer & letterhead).
> Verifikator = `verifikator` / `password`. Mahasiswa **tidak bisa** login pakai password (hanya email+OTP).

### Keputusan yang masih perlu dari user

1. **reCAPTCHA** — coba apa adanya lewat ngrok / kosongkan `RECAPTCHA_SECRET_KEY` (user harus edit sendiri, file `.env` tak bisa dibaca agent: permission denied) / uji lewat `localhost:8000` saja.
2. **Boleh ubah data DB `magangdb`?** Terutama: boleh menyentuh `MGG-2026-0051` (satu-satunya data alur TTE lengkap) atau harus bikin data baru?
3. **Boleh jalankan perintah tulis?** (`migrate:fresh --seed`, `magang:transition-statuses`, `npm run build`)

---

## 2. Strategi: mana yang lewat Pest, mana yang lewat browser

Sebagian besar prioritas user **bukan** hal yang cocok diuji lewat browser:

| Jalur | Untuk item | Kenapa |
|---|---|---|
| **Pest** (`php artisan test`, DB `magang_test`) | §1 OTP, §2 role, §3 workflow, §4 jobs, §5 sertifikat/IDOR, §7 DB, §8 security, §9 e2e | **Melewati reCAPTCHA** (phpunit tanpa secret → `App\Rules\Recaptcha` di-skip), bisa `Queue::fake`/`Mail::fake`, deterministik, bisa diulang |
| **Baca kode** | §2 middleware, §8 mass assignment/raw query/CSRF, §5 escaping PDF, §7 index & `down()` | Lebih cepat & lebih menyeluruh daripada coba-coba |
| **Browser (Playwright MCP)** | §6 Inertia/React (layar putih, error konsol, validasi per-field, loading state, flash), sweep ~25 halaman 3 role | Hanya render/UX yang tak bisa dilihat dari test |
| **Manual/beban** | §10 performance | Perlu data besar (belum ada) |

Skill repo yang relevan: **`cek-halaman`** (verifikasi halaman role benar-benar ter-render, bukan layar putih — persis jebakan §6).

---

## 3. Checklist + status

### §1 Auth & OTP Flow

- [ ] Request OTP email valid → OTP terkirim (Job/Mailable terpicu) — cek di Mailpit :8025
- [ ] Request OTP email tak terdaftar → pesan jelas, **tidak** membocorkan keberadaan user
- [ ] OTP salah → ditolak, pesan jelas
- [ ] OTP expired → pesan spesifik (bukan generic). *Ada data siap pakai: `otp_tokens` id 1 sudah expired 2026-07-31*
- [ ] OTP dipakai 2× → ditolak (single-use)
- [ ] Rate limit request OTP berulang (`RateLimitService` + `FormRateLimit`)
- [ ] Lockout Fibonacci `OtpLockoutService`: 3 OTP salah → token diinvalidasi + cooldown 1,1,2,3,5,8 menit; reset saat login sukses / 24 jam idle
- [x] **Prioritas #2 — route `/login` Fortify BUKAN backdoor.** Terverifikasi 2026-08-05 (kode + `route:list`):
      • **Tidak ada** route URI `login` polos. Satu-satunya login form = **`admin/login`** (nama route `login`), `config/fortify.php:105 paths.login = 'admin/login'`.
      • `FortifyServiceProvider::configureAuthentication()` memfilter **`whereIn('role', [UserRole::AdminVerifikator, UserRole::AdminOpd])`** → mahasiswa **tak bisa** login lewat jalur ini walaupun kolom `password`-nya menyimpan hash OTP. Plus cek `Hash::check` + `is_active`.
      • `config/fortify.php:163 features => []` → **registration, password reset, 2FA semuanya MATI** (inilah 9 test skip yang wajar).
      • Rate limit ada: `POST admin/login` → `throttle:login` = **5/menit** per `username|ip` (`configureRateLimiting()`).
      • Sisa permukaan Fortify: `GET/POST /user/confirm-password` (middleware `auth:web`) — bawaan, bukan celah.
      → **Sisa yang perlu bukti runtime:** test Pest yang mencoba login mahasiswa via `POST admin/login` dan memastikan gagal. **Belum ada.**
- [ ] Session setelah login OTP sukses → redirect sesuai role
- [ ] Logout membersihkan session
- [ ] Single-session: satu browser tak boleh pegang 2 akun → 403; sesi lain diinvalidasi saat login (sudah ada `Security/SingleSessionTest`)

### §2 Role & Permission

- [-] ~~Spatie Permission~~ → **tidak dipakai.** Yang benar: enum `UserRole` + middleware `EnsureUserRole` (alias `role:`)
- [ ] Mahasiswa tak bisa akses route verifikator/OPD
- [ ] OPD tak bisa akses aksi verifikator & sebaliknya
- [ ] Middleware `role:` terpasang di **semua** route sensitif (bukan cuma disembunyikan di UI) — **perlu audit tabel route yang menulis data vs middleware-nya**
- [ ] Hit endpoint langsung (bukan lewat UI) dengan role salah → tetap 403 di backend
- [ ] User tanpa role / role tak valid → ditangani aman (`EnsureUserRole` saat `role` null)
- [ ] Route yang dibagi beberapa role (`role:a,b,c`) punya guard **ownership** tambahan? (`kuota/{opd}`, `opd-tag/{opd}`, `pengajuan/{application}/foto|dokumen`, `presensi/{log}/lampiran`)

### §3 Submission Workflow

- [ ] Submit lengkap → tersimpan benar
- [ ] Field wajib kosong → validasi client & server
- [ ] Upload dokumen: tipe, ukuran max (surat pengantar 2MB / CV 2MB / portofolio 10MB), penyimpanan disk **private**
- [ ] Transisi status sesuai `guardStatus()` (pending_verifikator → forwarded_opd → waiting_tte → approved → ongoing → …)
- [ ] Verifikator menolak → alasan **wajib** & tersimpan
- [ ] Submission ganda user yang sama → sesuai business rule
- [-] ~~Ticket format MGG- vs EMG-~~ → **sudah konsisten MGG-, nol kemunculan EMG-.** Tidak ada keputusan menggantung
- [ ] Periode: `duration_months` dihitung server (`round(days/30.4375)`, min 1), maks 12 bulan ditolak (bukan di-clamp)

### §4 Jobs & Mailables (**7 Jobs**, 5 Mailables)

- [ ] Tiap Job ter-dispatch di trigger yang tepat
- [ ] Job gagal → masuk `failed_jobs`, tidak silent — ⚠️ **tak bisa diuji dengan `QUEUE_CONNECTION=sync`** (kondisi saat ini)
- [ ] Retry sesuai konfigurasi (`tries = 3` + backoff, queue `emails`)
- [ ] Tiap Mailable: konten & data benar (nama, status, link). Kontrak tampilan: `resources/js/pages/format_email.txt`
- [ ] Queue worker stabil saat banyak job antre
- [ ] **Verifikasi klaim "notification preferences belum persisten"** — belum dicek apakah fitur ini ada di kode sama sekali
- [ ] Cek Job/Mailable mana yang **belum punya** test (`Queue::fake`/`Mail::fake`)

### §5 Certificate Generation (CertificateService + DomPDF)

- [ ] Generate hanya setelah status selesai/disetujui
- [ ] Data sertifikat sesuai submission
- [ ] PDF aman untuk nama dengan karakter khusus (`"`, `&`, `<`) & non-ASCII
- [ ] Ukuran PDF wajar, tidak korup saat diunduh
- [ ] Mahasiswa tak bisa generate ulang / mengedit sertifikat sendiri
- [ ] **Prioritas #4 — IDOR:** mahasiswa A tak bisa unduh sertifikat mahasiswa B via URL langsung; `is_download_locked` benar-benar dicek; survei kepuasan wajib sebelum unduh terbuka
- [ ] IDOR pada berkas lain: `pengajuan/{application}/foto`, `dokumen/{type}`, `presensi/{log}/lampiran/{attachment}`, `profile/avatar`, arsip TTE OPD, `opd/laporan/{report}/berkas`

### §6 Inertia + React + TypeScript (jalur browser)

- [ ] Props backend ↔ tipe TS cocok (tak ada mismatch runtime)
- [ ] **Layar putih:** setiap halaman self-wrap `MagangLayout` menerima prop `user`. *Titik rapuh: `opd/menunggu-tte.tsx`, `opd/perlu-sertifikat.tsx`, `opd/surat.tsx` mendeklarasikan `user` non-optional tanpa fallback mock → crash kalau prop hilang. `/opd/surat` pernah kena bug ini (fixed 2026-07-30).* Pakai skill `cek-halaman`
- [ ] Error validasi backend tampil **per-field** di form Inertia
- [ ] Loading state pada aksi berat (submit, generate PDF)
- [ ] Shared data (`auth.user`, flash `success`/`error`) konsisten
- [ ] Refresh di tengah alur multi-step tak merusak state
- [ ] Sweep ~25 halaman 3 role: cari layar putih, error konsol, **dan data `MOCK_*` yang belum diganti data nyata** (23 halaman punya fallback `user = MOCK_USER` → menampilkan mock, bukan crash)

### §7 Database & Query

- [ ] Migration `up`/`down` reversible & aman diulang (42 migration) — tandai `down()` yang kosong/asimetris
- [ ] Tidak ada N+1 di listing submission. *Perhatikan: `Verifikator\DashboardController::recentApplications` **sengaja tanpa limit** (stat & chip dihitung di frontend) — jangan "perbaiki" jadi ber-limit*
- [ ] FK mencegah orphan; cek perilaku `cascadeOnDelete`/`nullOnDelete`
- [ ] Index pada kolom yang sering difilter (`status`, `opd_id`, `user_id`, `ticket_number`, `activity_date`)
- [ ] `presensi_logs` unique(`user_id`,`activity_date`) benar-benar menolak presensi 2× sehari

### §8 Security

- [ ] SQL injection — audit `DB::raw|whereRaw|selectRaw|DB::select|DB::statement` di app/
- [ ] XSS di field input user (nama, keterangan, alasan penolakan). *Middleware global `SanitizeInput` sudah strip `<script>`, `on*=`, `javascript:`. **Jangan tambah escaping saat render** — React/Blade sudah escape*
- [ ] CSRF tervalidasi di semua POST/PUT/DELETE; cek `validateCsrfTokens(except:)` di `bootstrap/app.php`
- [ ] Mass assignment: `$fillable`/`$guarded` tiap model — khusus kolom `role`, `status`, `opd_id`, `is_active`, `must_change_password`, `quota_used`, `is_download_locked`; cari `->update($request->all())`
- [ ] Upload: validasi tipe **nyata** (`mimetypes`, bukan cuma `mimes`/ekstensi), ukuran, disimpan di luar public root (disk `local` privat)
- [ ] Gate approve TTE: tanpa signer / letterhead tak lengkap → 422, kuota tak berubah, tak ada job ter-queue (`ApproveApplicationRequest`)

### §9 Regression / End-to-End

- [~] **Prioritas #1 direvisi:** `EndToEndFlowTest.php` **sudah ada** dan mencakup: daftar publik → forward verifikator → approve OPD → cron `magang:transition-statuses` → laporan mahasiswa → sertifikat → survei → unduh. **Tapi test ini sekarang GAGAL** (lihat di bawah). Langkah yang tampaknya belum dicakup: login OTP nyata & presensi harian
- [!] **Re-run baseline 2026-08-05: SUITE MERAH.** `php artisan test` → **216 tes: 202 lulus, 4 GAGAL, 10 skip** (1122 assertion, 8.5s).
      CLAUDE.md mengklaim baseline ~202 tes hijau — **dokumen itu sudah drift**: jumlah tes tumbuh 202 → 216 di commit setelah batch TTE (`826cdb9`, `1f995d2`, `2db07f0`) tanpa menjalankan gate penuh lagi.
      **Keempat kegagalan = masalah di sisi TEST, BUKAN bug aplikasi.** Aplikasi berperilaku tepat seperti gate TTE yang didokumentasikan.

### §10 Performance

- [ ] Response time listing submission dengan ratusan/ribuan record — ⚠️ **belum ada datanya** (1 pengajuan). Perlu factory/seeder khusus
- [ ] Generate PDF sertifikat tidak blocking (idealnya lewat Job/queue) — cek apakah inline dalam request
- [ ] Load test sederhana endpoint OTP (rawan spam)

---

---

## 3b. TEMUAN AKTIF: 4 test gagal (2026-08-05)

Semua sudah ditelusuri ke akarnya. **Tidak ada satu pun yang merupakan cacat aplikasi** — jadi jangan "perbaiki" kode produksi untuk mengejar ini.

### Kelompok A — 3 test basi: approve tanpa `signer_id` (sisa hutang batch TTE)

| Test | Baris | Gejala |
|---|---|---|
| `Penyelesaian/EndToEndFlowTest.php` | 84 | Harap `Approved`, dapat `ForwardedOpd` |
| `Verifikator/SkNumberTest.php` — *approve men-generate sk_number* | 42 | `sk_number` masih `null` |
| `Verifikator/SkNumberTest.php` — *auto-increment antar approve* | 62 | `sk_number` masih `null` |

**Akar:** ketiganya `POST /opd/pengajuan/{id}/approve` **tanpa `signer_id`**, dan OPD-nya dibuat via
`Opd::create([... 'quota_total' => 5])` → **tanpa letterhead & tanpa penandatangan**.
`ApproveApplicationRequest` (app/Http/Requests/Opd/ApproveApplicationRequest.php) sekarang:
- `rules()`: `'signer_id' => ['required', 'integer', Rule::exists('opd_signers','id')->where(opd_id = user.opd_id)]` — **unconditional required**
- `after()`: error `signer_id` bila `! $opd->signers()->exists()`, **dan** error `letterhead` bila salah satu dari `letterhead_address/phone/email` blank

→ Validasi gagal → redirect back → approve **tak pernah jalan** → status tetap `forwarded_opd`, `sk_number` tetap null.
Ini **persis perilaku yang diinginkan** (CLAUDE.md: "Approving requires a signer AND a complete letterhead"). Test-nya yang ditulis sebelum gate itu ada dan tak pernah diperbarui.

**Perbaikan (sisi test saja):** di ketiga test, buat OPD dengan letterhead lengkap + satu `OpdSigner`, lalu sertakan `'signer_id' => $signer->id` di payload approve. Pola yang benar sudah ada di `tests/Feature/Feature/Opd/TteFlowTest.php` helper `tteOpd()` (baris 28) + `tteSigner()` (baris 40) — **pakai ulang pola itu**, jangan tulis helper baru.
Konsekuensi ikutan: setelah `signer_id` diisi, approve menghasilkan status **`waiting_tte`**, bukan `approved` — jadi `EndToEndFlowTest` perlu menambah langkah upload surat TTE sebelum mengharapkan `ongoing`. Ini justru **menutup celah cakupan** yang dicari prioritas #1.

### Kelompok B — 1 bug test: atribut belum terhidrasi

`Opd/TteFlowTest.php:477` — *"ACC ditolak bila penandatangan tidak dipilih…"* → `Failed asserting that 0 is identical to null`

**Akar:** `tteOpd()` (baris 28-38) membuat OPD **tanpa** menyetel `quota_used`. Jadi `$kuotaAwal = $opd->quota_used` bernilai **`null`** (atribut tak pernah diisi dari default DB). Setelah `$opd->refresh()`, nilai default DB `0` termuat → assertion `toBe(null)` vs aktual `0` gagal.
Yang diuji (approve ditolak, kuota tak bertambah) **sebenarnya benar** — assertion-nya saja yang membandingkan dengan atribut basi.

**Perbaikan (pilih satu):** tambahkan `'quota_used' => 0` di `tteOpd()`, **atau** ganti `$kuotaAwal = $opd->quota_used` → `$kuotaAwal = (int) $opd->refresh()->quota_used`. Opsi pertama lebih baik: memperbaiki helper sekaligus mencegah jebakan yang sama di test lain yang memakainya.

> **Belum dikerjakan** — menunggu izin user untuk mengubah file test.

---

## 4. Log Sesi

### 2026-08-05 — Sesi 1: rekon + verifikasi asumsi

**Dilakukan (semuanya read-only, tidak ada perubahan kode/DB):**
1. Inventaris route lengkap 3 role (89 route non-vendor) + audit prop `user` → semua controller halaman dasbor **sudah** mengirim `MagangUserResource`. Tidak ada risiko layar putih yang aktif saat ini.
2. Rekon environment (lihat §1) — menemukan 3 bloker: reCAPTCHA aktif, Vite mati, scheduler mati.
3. Membantah 5 asumsi checklist (lihat §0).
4. **Menutup prioritas #2** (`/login` bukan backdoor) lewat pembacaan kode + `route:list`.

**Temuan sampingan (belum ditindak):**
- `[!]` `app/Http/Controllers/Mahasiswa/ApplicationController.php:43` merender `Inertia::render('mahasiswa/application/create', ...)` — **kode mati**: tak ada route yang memanggilnya DAN file `resources/js/pages/mahasiswa/application/create.tsx` **tidak ada**. Kalau route-nya dipasang → layar putih total. Juga tak mengirim prop `user`. Kandidat dihapus.
- `[!]` 34 dari 35 OPD **tanpa penandatangan & tanpa letterhead** → gate approve TTE akan menolak mereka. Ini benar secara aturan bisnis, tapi artinya data uji perlu disiapkan dulu untuk OPD selain BKD.
- `[!]` `MGG-2026-0051` masih `approved` padahal `start_date` 2026-08-01 sudah lewat → konsekuensi scheduler mati, bukan bug kode.
- 3 Explore agent mati kena **limit usage 5-jam ($5 window)** di tengah audit; sisa audit dilanjutkan langsung tanpa agent.

5. Menjalankan baseline `php artisan test` → **216 tes: 202 lulus, 4 gagal, 10 skip**. Keempat kegagalan ditelusuri sampai akar (lihat §3b) → semuanya masalah sisi test, bukan cacat aplikasi.

**Belum selesai / langkah berikutnya (urut prioritas):**
1. **Perbaiki 4 test di §3b** (butuh izin ubah file test). Ini memblokir semua pekerjaan lain: tak ada gunanya menambah test di atas baseline merah, dan checklist §9 mensyaratkan "hijau semua".
2. Jawab 3 keputusan di §1 ("Keputusan yang masih perlu dari user") — terutama reCAPTCHA, yang menentukan apakah pengujian browser bisa jalan sama sekali.
3. Audit tabel route-yang-menulis vs middleware `role:` (prioritas #3) — murni baca kode, tak butuh izin apa pun.
4. Audit IDOR semua controller penyaji berkas (prioritas #4) — baca kode + test Pest.
5. Uji rate limit OTP (prioritas #5) — Pest, melewati reCAPTCHA.
6. Sweep browser ~25 halaman 3 role (§6) — **tergantung keputusan reCAPTCHA**.

**Catatan untuk sesi berikutnya:** CLAUDE.md bagian "Tests" menyebut baseline "~202 tests, 10 skipped" seolah hijau. Setelah 4 test itu diperbaiki, **perbarui angka di CLAUDE.md** ke jumlah sebenarnya (216) supaya drift ini tidak terulang.
