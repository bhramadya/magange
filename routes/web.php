<?php

use App\Http\Controllers\Auth\OtpLoginController;
use App\Http\Controllers\BantuanController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LacakController;
use App\Http\Controllers\Mahasiswa\DashboardController as MahasiswaDashboardController;
use App\Http\Controllers\Mahasiswa\PengajuanSayaController;
use App\Http\Controllers\Mahasiswa\PenyelesaianController;
use App\Http\Controllers\Opd\DashboardController as OpdDashboardController;
use App\Http\Controllers\Opd\KeputusanController;
use App\Http\Controllers\Opd\PesertaController;
use App\Http\Controllers\PengajuanPublikController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\Verifikator\DashboardController as VerifikatorDashboardController;
use App\Http\Controllers\Verifikator\MasukController;
use App\Http\Controllers\Verifikator\RiwayatController;
use Illuminate\Support\Facades\Route;

// --- Publik (tanpa login) ---
Route::get('/', [HomeController::class, 'index'])->name('home');

// Login OTP 2-langkah (/login murni dikelola Fortify; /logout juga Fortify).
Route::get('login-otp', [OtpLoginController::class, 'showForm'])->name('login.otp');
Route::post('login/otp/request', [OtpLoginController::class, 'sendOtp'])->name('login.otp.request');
Route::post('login/otp/verify', [OtpLoginController::class, 'verifyOtp'])->name('login.otp.verify');

// Lacak status publik + form pendaftaran (anchor #daftar di welcome).
Route::get('lacak', [LacakController::class, 'index'])->name('lacak');
Route::post('pengajuan', [PengajuanPublikController::class, 'store'])->name('pengajuan.store');

// --- Dasbor Mahasiswa ---
Route::middleware(['auth', 'role:mahasiswa'])->group(function (): void {
    Route::get('dashboard', [MahasiswaDashboardController::class, 'index'])->name('dashboard');
    Route::get('pengajuan', [PengajuanSayaController::class, 'index'])->name('mahasiswa.pengajuan');

    Route::get('penyelesaian', [PenyelesaianController::class, 'index'])->name('penyelesaian');
    Route::post('penyelesaian/laporan', [PenyelesaianController::class, 'uploadLaporan'])->name('penyelesaian.laporan');
    Route::post('penyelesaian/survei', [PenyelesaianController::class, 'submitSurvei'])->name('penyelesaian.survei');
    Route::get('penyelesaian/sertifikat', [PenyelesaianController::class, 'downloadSertifikat'])->name('penyelesaian.sertifikat');
});

// --- Dasbor Verifikator ---
Route::middleware(['auth', 'role:admin_verifikator'])->group(function (): void {
    Route::get('verifikator', [VerifikatorDashboardController::class, 'index'])->name('verifikator.dashboard');
    Route::get('verifikator/masuk', [MasukController::class, 'index'])->name('verifikator.masuk');
    Route::get('verifikator/riwayat', [RiwayatController::class, 'index'])->name('verifikator.riwayat');

    Route::post('verifikator/pengajuan/{application}/teruskan', [MasukController::class, 'teruskan'])->name('verifikator.teruskan');
    Route::post('verifikator/pengajuan/{application}/tolak', [MasukController::class, 'tolak'])->name('verifikator.tolak');
});

// --- Dasbor OPD ---
Route::middleware(['auth', 'role:admin_opd'])->group(function (): void {
    Route::get('opd', [OpdDashboardController::class, 'index'])->name('opd.dashboard');
    Route::get('opd/keputusan', [KeputusanController::class, 'index'])->name('opd.keputusan');
    Route::get('opd/peserta', [PesertaController::class, 'index'])->name('opd.peserta');

    Route::post('opd/pengajuan/{application}/setujui', [KeputusanController::class, 'setujui'])->name('opd.setujui');
    Route::post('opd/pengajuan/{application}/tolak', [KeputusanController::class, 'tolak'])->name('opd.tolak');
});

// ── Bersama semua role (perlu login) ──
Route::middleware('auth')->group(function (): void {
    Route::get('bantuan', [BantuanController::class, 'index'])->name('bantuan');

    Route::get('pengaturan', [PengaturanController::class, 'index'])->name('pengaturan');
    Route::patch('pengaturan/profil', [PengaturanController::class, 'updateProfil'])->name('pengaturan.profil');
    Route::patch('pengaturan/notifikasi', [PengaturanController::class, 'updateNotifikasi'])->name('pengaturan.notifikasi');
});

require __DIR__.'/settings.php';
