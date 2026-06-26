<?php

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
Route::inertia('lacak', 'lacak')->name('lacak');                   // Lacak status publik (pendaftaran lewat form di welcome #daftar)

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

require __DIR__.'/settings.php';
