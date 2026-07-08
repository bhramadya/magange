<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Urutan penting: OPD dahulu (dipakai AdminSeeder),
     * lalu admin (Verifikator dipakai FaqSeeder sebagai created_by),
     * terakhir data demo pengajuan (butuh OPD + admin sudah ada).
     */
    public function run(): void
    {
        $this->call([
            OpdSeeder::class,
            AdminSeeder::class,
            FaqSeeder::class,
            ApplicationSeeder::class,
        ]);
    }
}
