<?php

use App\Http\Controllers\ApplicationDocumentController;
use App\Http\Controllers\ApplicationPhotoController;
use App\Http\Controllers\Auth\ForcePasswordController;
use App\Http\Controllers\Auth\OtpLoginController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Mahasiswa\ApplicationController;
use App\Http\Controllers\Mahasiswa\CertificateController;
use App\Http\Controllers\Mahasiswa\DashboardController as MahasiswaDashboardController;
use App\Http\Controllers\Mahasiswa\PresensiController;
use App\Http\Controllers\Mahasiswa\ReportController;
use App\Http\Controllers\Opd\DashboardController as OpdDashboardController;
use App\Http\Controllers\Opd\SubmissionController as OpdSubmissionController;
use App\Http\Controllers\OpdQuotaController;
use App\Http\Controllers\ProfileAvatarController;
use App\Http\Controllers\SharedPageController;
use App\Http\Controllers\Verifikator\AdminController;
use App\Http\Controllers\Verifikator\DashboardController as VerifikatorDashboardController;
use App\Http\Controllers\Verifikator\FaqController;
use App\Http\Controllers\Verifikator\OpdController;
use App\Http\Controllers\Verifikator\PengajuanController;
use App\Http\Controllers\Verifikator\ReportController as VerifikatorReportController;
use App\Http\Controllers\Verifikator\SkCounterController;
use App\Http\Controllers\Verifikator\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

/*
|--------------------------------------------------------------------------
| PRATINJAU FRONTEND (SEMENTARA — hapus saat backend wiring siap)
|--------------------------------------------------------------------------
| Rute di-PATH ASLI & TANPA auth/props supaya seluruh navigasi dasbor bisa
| diklik langsung saat pratinjau. Tiap komponen render dengan mock default-nya.
|
| Rekan backend nanti tinggal:
|   1) Ganti Route::inertia(...) -> controller + Inertia::render(...) dengan props.
|   2) Bungkus rute dasbor dengan middleware auth + role (mis. role:mahasiswa).
| Path tidak perlu berubah, jadi href nav di frontend tetap sama.
*/

// --- Publik (tanpa login) ---
Route::get('login-otp', [OtpLoginController::class, 'showForm'])->name('login.otp');  // Login OTP mahasiswa (login admin di /admin/login via Fortify)
Route::post('otp/send', [OtpLoginController::class, 'sendOtp'])->name('otp.send');
Route::post('otp/verify', [OtpLoginController::class, 'verifyOtp'])->name('otp.verify');
Route::get('lacak', [ApplicationController::class, 'track'])->name('lacak'); // Lacak status publik (via ?email=)

// Pengajuan publik (tanpa login): kirim pengajuan dari form welcome #daftar.
// Catatan: halaman form khusus `pengajuan/baru` (mahasiswa/application/create)
// belum dibuat — form hidup ada di welcome.tsx, jadi rutenya belum dipasang.
Route::post('pengajuan', [ApplicationController::class, 'store'])->name('pengajuan.store');

// --- Login Admin (Username + Password) ---
// Dilayani Laravel Fortify di `admin/login` (config fortify.paths.login):
//   GET  admin/login -> loginView (Inertia auth/admin-login)  [name: login]
//   POST admin/login -> AuthenticatedSessionController@store   [name: login.store]
// Logika role/is_active/single-session ada di FortifyServiceProvider.

// Ganti password wajib (R10): akun admin auto-generate (must_change_password)
// dipaksa ke sini oleh middleware password.changed sebelum membuka dasbor.
Route::middleware(['auth', 'role:admin_verifikator,admin_opd'])->group(function () {
    Route::get('admin/password-baru', [ForcePasswordController::class, 'show'])->name('password.force.show');
    Route::post('admin/password-baru', [ForcePasswordController::class, 'store'])->name('password.force.store');
});

// --- Dasbor Mahasiswa (tersambung: auth + role) ---
Route::middleware(['auth', 'role:mahasiswa'])->group(function () {
    Route::get('dashboard', [MahasiswaDashboardController::class, 'index'])->name('dashboard');
    Route::get('pengajuan', [MahasiswaDashboardController::class, 'pengajuan'])->name('mahasiswa.pengajuan');
    Route::get('penyelesaian', [MahasiswaDashboardController::class, 'penyelesaian'])->name('mahasiswa.penyelesaian');
    // Log Presensi Harian (revisi #22): riwayat + simpan + lampiran privat.
    Route::get('presensi', [PresensiController::class, 'index'])->name('presensi.index');
    Route::post('presensi', [PresensiController::class, 'store'])->name('presensi.store');
    Route::get('presensi/{log}/lampiran/{attachment}', [PresensiController::class, 'attachment'])->name('presensi.lampiran');
    Route::delete('presensi/{log}', [PresensiController::class, 'destroy'])->name('presensi.destroy');
});

// --- Dasbor Verifikator (tersambung: auth + role) ---
Route::middleware(['auth', 'role:admin_verifikator'])->group(function () {
    Route::get('verifikator', [VerifikatorDashboardController::class, 'index'])->name('verifikator.dashboard');
    Route::get('verifikator/masuk', [VerifikatorDashboardController::class, 'masuk'])->name('verifikator.masuk');
    Route::get('verifikator/riwayat', [VerifikatorDashboardController::class, 'riwayat'])->name('verifikator.riwayat');
    // Kelola OPD (CRUD penuh) menggantikan halaman "Kelola Kuota OPD" lama.
    // Halaman kuota lama tetap tersedia untuk kompatibilitas tautan/tes.
    Route::get('verifikator/kuota', [VerifikatorDashboardController::class, 'kuota'])->name('verifikator.kuota');
});

// --- Dasbor OPD (tersambung: auth + role) ---
Route::middleware(['auth', 'role:admin_opd'])->group(function () {
    Route::get('opd', [OpdDashboardController::class, 'index'])->name('opd.dashboard');
    Route::get('opd/keputusan', [OpdDashboardController::class, 'keputusan'])->name('opd.keputusan');
    Route::get('opd/peserta', [OpdDashboardController::class, 'peserta'])->name('opd.peserta');
});

// --- Bersama semua role (butuh login: header/sidebar pakai user yang login) ---
Route::middleware('auth')->group(function () {
    Route::get('bantuan', [SharedPageController::class, 'bantuan'])->name('bantuan');          // Pusat Bantuan
    Route::get('pengaturan', [SharedPageController::class, 'pengaturan'])->name('pengaturan'); // Pengaturan
});

/*
|--------------------------------------------------------------------------
| AKSI DOMAIN (backend nyata — auth + role, controller tipis -> service)
|--------------------------------------------------------------------------
| Endpoint POST untuk transisi state machine pengajuan. Path index dasbor
| masih pratinjau di atas; ini menyambungkan aksi form-nya lebih dahulu.
*/

// Verifikator: teruskan / tolak / tandai selesai.
Route::middleware(['auth', 'role:admin_verifikator'])
    ->prefix('verifikator/pengajuan')
    ->name('verifikator.pengajuan.')
    ->group(function () {
        Route::post('{application}/forward', [PengajuanController::class, 'forward'])->name('forward');
        Route::post('{application}/reject', [PengajuanController::class, 'reject'])->name('reject');
        Route::post('{application}/complete', [PengajuanController::class, 'complete'])->name('complete');
    });

// OPD: setujui / tolak / tandai selesai.
Route::middleware(['auth', 'role:admin_opd'])
    ->prefix('opd/pengajuan')
    ->name('opd.pengajuan.')
    ->group(function () {
        Route::post('{application}/approve', [OpdSubmissionController::class, 'approve'])->name('approve');
        Route::post('{application}/reject', [OpdSubmissionController::class, 'reject'])->name('reject');
        Route::post('{application}/complete', [OpdSubmissionController::class, 'complete'])->name('complete');
    });

// Mahasiswa: unggah laporan akhir (aktor "Selesai" #4 saat is_confirmed).
Route::middleware(['auth', 'role:mahasiswa'])
    ->post('mahasiswa/pengajuan/{application}/laporan', [ReportController::class, 'store'])
    ->name('mahasiswa.pengajuan.laporan');

// Mahasiswa: Ajukan Ulang tiket rejected (R15) — tiket baru, data ter-copy.
Route::middleware(['auth', 'role:mahasiswa'])
    ->post('mahasiswa/pengajuan/{application}/ajukan-ulang', [ApplicationController::class, 'resubmit'])
    ->name('mahasiswa.pengajuan.ajukan-ulang');

// Kuota OPD: Admin OPD ubah kuota sendiri, Admin Verifikator ubah semua.
// Cek kepemilikan (403) ada di UpdateQuotaRequest::authorize().
Route::middleware(['auth', 'role:admin_opd,admin_verifikator'])
    ->patch('kuota/{opd}', [OpdQuotaController::class, 'update'])
    ->name('kuota.update');

// Pas foto pemohon (disk privat) untuk pemilik/admin. Otorisasi via
// policy view: Mahasiswa pemilik, Verifikator semua, OPD hanya pengajuan miliknya.
Route::middleware(['auth', 'role:mahasiswa,admin_opd,admin_verifikator'])
    ->get('pengajuan/{application}/foto', [ApplicationPhotoController::class, 'show'])
    ->name('pengajuan.foto');

// Berkas pendukung pengajuan (disk privat): Surat Pengantar / CV / Portofolio.
Route::middleware(['auth', 'role:mahasiswa,admin_opd,admin_verifikator'])
    ->get('pengajuan/{application}/dokumen/{type}', [ApplicationDocumentController::class, 'show'])
    ->whereIn('type', ['surat-pengantar', 'cv', 'portofolio'])
    ->name('pengajuan.dokumen');

// Foto profil pengguna yang login (disk privat). Untuk mahasiswa, otomatis
// diisi dari pas foto pendaftaran. Tanpa parameter → hanya avatar diri sendiri.
Route::middleware('auth')
    ->get('profile/avatar', [ProfileAvatarController::class, 'show'])
    ->name('profile.avatar');

/*
|--------------------------------------------------------------------------
| PENYELESAIAN (Fase 4 — review laporan, sertifikat, survei)
|--------------------------------------------------------------------------
| Ekor alur magang: Verifikator meninjau laporan akhir & mengunggah
| sertifikat (terkunci); Mahasiswa mengisi survei wajib untuk membuka
| kunci unduhan, lalu mengunduh e-sertifikat.
*/

// Verifikator: tinjau laporan akhir + unggah sertifikat selesai.
Route::middleware(['auth', 'role:admin_verifikator'])
    ->prefix('verifikator/laporan')
    ->name('verifikator.laporan.')
    ->group(function () {
        Route::get('/', [VerifikatorReportController::class, 'index'])->name('index');
        Route::get('{report}/berkas', [VerifikatorReportController::class, 'downloadReport'])->name('berkas');
        Route::post('{report}/approve', [VerifikatorReportController::class, 'approve'])->name('approve');
        Route::post('{report}/sertifikat', [VerifikatorReportController::class, 'uploadCertificate'])->name('sertifikat');
        // R9: Surat Penyelesaian Magang ber-kop Kominfo — generate sekali
        // (nomor & tanggal SK statis), unduh dari arsip disk privat.
        Route::post('{report}/surat-penyelesaian', [VerifikatorReportController::class, 'generateCompletionLetter'])->name('surat-penyelesaian');
        Route::get('{report}/surat-penyelesaian', [VerifikatorReportController::class, 'downloadCompletionLetter'])->name('surat-penyelesaian.download');
    });

// Mahasiswa: kirim survei wajib (buka kunci) + unduh sertifikat.
Route::middleware(['auth', 'role:mahasiswa'])
    ->prefix('sertifikat')
    ->name('mahasiswa.sertifikat.')
    ->group(function () {
        Route::post('{certificate}/survei', [CertificateController::class, 'submitSurvey'])->name('survei');
        Route::get('{certificate}/download', [CertificateController::class, 'download'])->name('download');
    });

// Verifikator: atur start number counter Nomor SK (R5), mis. mulai dari 40.
// Body: { key: 'acceptance'|'completion', start_number: int }.
Route::middleware(['auth', 'role:admin_verifikator'])
    ->patch('verifikator/sk-counter', [SkCounterController::class, 'update'])
    ->name('verifikator.sk-counter.update');

// Verifikator: kelola FAQ (tampil di landing page publik).
Route::middleware(['auth', 'role:admin_verifikator'])
    ->prefix('verifikator/faq')
    ->name('verifikator.faq.')
    ->group(function () {
        Route::get('/', [FaqController::class, 'index'])->name('index');
        Route::get('create', [FaqController::class, 'create'])->name('create');
        Route::post('/', [FaqController::class, 'store'])->name('store');
        Route::get('{faq}/edit', [FaqController::class, 'edit'])->name('edit');
        Route::put('{faq}', [FaqController::class, 'update'])->name('update');
        Route::delete('{faq}', [FaqController::class, 'destroy'])->name('destroy');
    });

// Verifikator: kelola OPD (CRUD penuh). Hanya Verifikator yang mengelola OPD.
Route::middleware(['auth', 'role:admin_verifikator'])
    ->prefix('verifikator/opd')
    ->name('verifikator.opd.')
    ->group(function () {
        Route::get('/', [OpdController::class, 'index'])->name('index');
        Route::get('create', [OpdController::class, 'create'])->name('create');
        Route::post('/', [OpdController::class, 'store'])->name('store');
        Route::get('{opd}/edit', [OpdController::class, 'edit'])->name('edit');
        Route::put('{opd}', [OpdController::class, 'update'])->name('update');
        Route::delete('{opd}', [OpdController::class, 'destroy'])->name('destroy');
        // R10: reset password akun Admin OPD (kredensial via flash, tampil sekali).
        Route::post('{opd}/reset-password', [OpdController::class, 'resetPassword'])->name('reset-password');
    });

// Verifikator: Kelola User (R12) — akun mahasiswa, status aktif, last_login.
Route::middleware(['auth', 'role:admin_verifikator'])
    ->prefix('verifikator/users')
    ->name('verifikator.users.')
    ->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::patch('{user}/toggle-active', [UserController::class, 'toggleActive'])->name('toggle-active');
    });

// Verifikator: Kelola Admin (R13) — sesama verifikator, password auto-generate.
Route::middleware(['auth', 'role:admin_verifikator'])
    ->prefix('verifikator/admins')
    ->name('verifikator.admins.')
    ->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('index');
        Route::post('/', [AdminController::class, 'store'])->name('store');
        Route::post('{user}/reset-password', [AdminController::class, 'resetPassword'])->name('reset-password');
        Route::delete('{user}', [AdminController::class, 'destroy'])->name('destroy');
    });

require __DIR__.'/settings.php';
