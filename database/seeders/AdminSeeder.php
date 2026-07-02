<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    /**
     * Akun admin awal: 1 Admin Verifikator + 1 Admin OPD per OPD.
     *
     * Catatan: kolom password diisi hash sementara untuk kebutuhan dev.
     * Pada produksi, alur login final (OTP) akan menimpa kolom ini.
     */
    public function run(): void
    {
        // Admin Verifikator (admin utama/tengah)
        User::updateOrCreate(
            ['email' => 'verifikator@madiunkota.go.id'],
            [
                'name' => 'Admin Verifikator',
                'username' => 'verifikator',
                'whatsapp_number' => '081234567890',
                'password' => Hash::make('password'),
                'role' => UserRole::AdminVerifikator,
                'is_active' => true,
            ],
        );

        // Admin OPD: satu akun per OPD. Username = slug kode OPD.
        Opd::query()->each(function (Opd $opd): void {
            $slug = Str::lower(str_replace(['/', ' '], '-', $opd->code));

            User::updateOrCreate(
                ['email' => "{$slug}@opd.madiunkota.go.id"],
                [
                    'name' => 'Admin '.$opd->code,
                    'username' => $slug,
                    'password' => Hash::make('password'),
                    'role' => UserRole::AdminOpd,
                    'opd_id' => $opd->id,
                    'is_active' => true,
                ],
            );
        });
    }
}
