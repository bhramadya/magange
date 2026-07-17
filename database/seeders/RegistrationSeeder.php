<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\UserRole;
use App\Models\InternshipApplication;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Data pendaftaran dari form publik (#daftar) — diinjeksi langsung ke DB
 * agar melewati reCAPTCHA v2 (anti-bot) yang tidak bisa diselesaikan otomatis.
 * Ini adalah data tunggal (bukan demo spektrum status) yang merepresentasikan
 * satu pengajuan magang nyata dengan status awal PendingVerifikator.
 *
 * Idempoten: dilewati bila NIS sudah ada.
 */
class RegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $nis = '220401073';

        if (InternshipApplication::where('nis', $nis)->exists()) {
            return;
        }

        $opd = Opd::where('code', 'DISKOMINFO')->first();

        $user = User::updateOrCreate(
            ['email' => 'budi.santoso.test@mailnesia.com'],
            [
                'name' => 'Budi Santoso Wibowo',
                'whatsapp_number' => '081255443322',
                'role' => UserRole::Mahasiswa,
                'is_active' => true,
                'avatar_path' => 'applications/photos/budi-santoso-pasfoto.png',
            ],
        );

        InternshipApplication::create([
            'ticket_number' => 'MGG-2026-0051',
            'user_id' => $user->id,
            'nis' => $nis,
            'tujuan_magang' => 'DINAS KOMUNIKASI DAN INFORMATIKA',
            'duration_months' => 3,
            'start_date' => Carbon::parse('2026-08-01')->toDateString(),
            'end_date' => Carbon::parse('2026-10-31')->toDateString(),
            'institution_name' => 'Universitas Brawijaya',
            'major' => 'Teknik Informatika',
            'skills' => 'Desain grafis, pemrograman web, analisis data',
            'address' => 'Jl. Merdeka No. 45 RT 03 RW 02, Kel. Taman, Kec. Taman, Kota Madiun',
            'campus_supervisor' => 'Dr. Siti Aminah, M.Kom',
            'campus_supervisor_whatsapp' => '081234567890',
            'guardian_name' => 'H. Slamet Widodo',
            'guardian_whatsapp' => '081298765432',
            'photo_path' => 'applications/photos/budi-santoso-pasfoto.png',
            'status' => ApplicationStatus::PendingVerifikator,
            'opd_id' => $opd?->id,
        ]);
    }
}
