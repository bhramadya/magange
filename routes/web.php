<?php

use App\Http\Controllers\Auth\AdminLoginController;
use App\Http\Controllers\Auth\OtpLoginController;
use App\Http\Controllers\Mahasiswa\ReportController;
use App\Http\Controllers\Opd\SubmissionController as OpdSubmissionController;
use App\Http\Controllers\OpdQuotaController;
use App\Http\Controllers\Verifikator\PengajuanController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

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
Route::inertia('login-otp', 'auth/otp-login')->name('login.otp');  // Login OTP (/login asli dikelola Fortify)
Route::post('otp/send', [OtpLoginController::class, 'sendOtp'])->name('otp.send');
Route::post('otp/verify', [OtpLoginController::class, 'verifyOtp'])->name('otp.verify');
Route::inertia('lacak', 'lacak')->name('lacak');                   // Lacak status publik (pendaftaran lewat form di welcome #daftar)

// --- Login Admin (Username + Password, terpisah dari OTP mahasiswa) ---
Route::get('admin/login', [AdminLoginController::class, 'showForm'])->name('admin.login');
Route::post('admin/login', [AdminLoginController::class, 'authenticate'])->name('admin.login.attempt');

// --- Dasbor Mahasiswa ---
Route::inertia('dashboard', 'mahasiswa/dashboard')->name('dashboard'); // Dasbor mahasiswa
Route::inertia('pengajuan', 'mahasiswa/pengajuan');                // Pengajuan Saya
Route::inertia('penyelesaian', 'mahasiswa/penyelesaian');          // Penyelesaian & sertifikat

// --- Dasbor Verifikator ---
Route::inertia('verifikator', 'verifikator/dashboard');            // Dasbor verifikator
Route::inertia('verifikator/masuk', 'verifikator/masuk');          // Pengajuan masuk
Route::inertia('verifikator/riwayat', 'verifikator/riwayat');      // Riwayat keputusan

// --- Dasbor OPD ---
Route::inertia('opd', 'opd/dashboard');                            // Dasbor OPD
Route::inertia('opd/keputusan', 'opd/keputusan');                  // Perlu keputusan
Route::inertia('opd/peserta', 'opd/peserta');                      // Peserta aktif

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

require __DIR__.'/settings.php';
