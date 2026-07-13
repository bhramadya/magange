<?php

use App\Http\Controllers\ApplicationPhotoController;
use App\Http\Controllers\Auth\OtpLoginController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Mahasiswa\ApplicationController;
use App\Http\Controllers\Mahasiswa\CertificateController;
use App\Http\Controllers\Mahasiswa\DashboardController as MahasiswaDashboardController;
use App\Http\Controllers\Mahasiswa\ReportController;
use App\Http\Controllers\Opd\DashboardController as OpdDashboardController;
use App\Http\Controllers\Opd\SubmissionController as OpdSubmissionController;
use App\Http\Controllers\OpdQuotaController;
use App\Http\Controllers\ProfileAvatarController;
use App\Http\Controllers\Verifikator\DashboardController as VerifikatorDashboardController;
use App\Http\Controllers\Verifikator\FaqController;
use App\Http\Controllers\Verifikator\PengajuanController;
use App\Http\Controllers\Verifikator\ReportController as VerifikatorReportController;
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

// --- Dasbor Mahasiswa (tersambung: auth + role) ---
Route::middleware(['auth', 'role:mahasiswa'])->group(function () {
    Route::get('dashboard', [MahasiswaDashboardController::class, 'index'])->name('dashboard');
    Route::get('pengajuan', [MahasiswaDashboardController::class, 'pengajuan'])->name('mahasiswa.pengajuan');
    Route::get('penyelesaian', [MahasiswaDashboardController::class, 'penyelesaian'])->name('mahasiswa.penyelesaian');
});

// --- Dasbor Verifikator (tersambung: auth + role) ---
Route::middleware(['auth', 'role:admin_verifikator'])->group(function () {
    Route::get('verifikator', [VerifikatorDashboardController::class, 'index'])->name('verifikator.dashboard');
    Route::get('verifikator/masuk', [VerifikatorDashboardController::class, 'masuk'])->name('verifikator.masuk');
    Route::get('verifikator/riwayat', [VerifikatorDashboardController::class, 'riwayat'])->name('verifikator.riwayat');
    Route::get('verifikator/kuota', [VerifikatorDashboardController::class, 'kuota'])->name('verifikator.kuota');
});

// --- Dasbor OPD (tersambung: auth + role) ---
Route::middleware(['auth', 'role:admin_opd'])->group(function () {
    Route::get('opd', [OpdDashboardController::class, 'index'])->name('opd.dashboard');
    Route::get('opd/keputusan', [OpdDashboardController::class, 'keputusan'])->name('opd.keputusan');
    Route::get('opd/peserta', [OpdDashboardController::class, 'peserta'])->name('opd.peserta');
});

// --- Bersama semua role ---
Route::inertia('bantuan', 'bantuan')->name('bantuan');             // Pusat Bantuan
Route::inertia('pengaturan', 'pengaturan')->name('pengaturan');    // Pengaturan

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

// Kuota OPD: Admin OPD ubah kuota sendiri, Admin Verifikator ubah semua.
// Cek kepemilikan (403) ada di UpdateQuotaRequest::authorize().
Route::middleware(['auth', 'role:admin_opd,admin_verifikator'])
    ->patch('kuota/{opd}', [OpdQuotaController::class, 'update'])
    ->name('kuota.update');

// Pas foto pemohon (disk privat) untuk pop-up tinjau admin. Otorisasi via
// policy view: Verifikator semua, OPD hanya pengajuan miliknya.
Route::middleware(['auth', 'role:admin_opd,admin_verifikator'])
    ->get('pengajuan/{application}/foto', [ApplicationPhotoController::class, 'show'])
    ->name('pengajuan.foto');

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
    });

// Mahasiswa: kirim survei wajib (buka kunci) + unduh sertifikat.
Route::middleware(['auth', 'role:mahasiswa'])
    ->prefix('sertifikat')
    ->name('mahasiswa.sertifikat.')
    ->group(function () {
        Route::post('{certificate}/survei', [CertificateController::class, 'submitSurvey'])->name('survei');
        Route::get('{certificate}/download', [CertificateController::class, 'download'])->name('download');
    });

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

require __DIR__.'/settings.php';
