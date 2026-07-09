<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Field tambahan formulir pendaftaran publik (flowchart-final, Fase 1):
     *  - nis           : Nomor Induk Siswa/Mahasiswa.
     *  - address       : Alamat domisili lengkap peserta.
     *  - guardian_name : Nama penanggung jawab / wali (BUKAN person_in_charge,
     *                    yang merupakan PJ lapangan diisi Admin OPD).
     *  - photo_path    : Path pas foto pada disk privat `local`.
     * Semua nullable agar tidak merusak data/factory/seeder lama.
     */
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->string('nis', 30)
                ->nullable()
                ->after('user_id')
                ->comment('Nomor Induk Siswa/Mahasiswa');
            $table->text('address')
                ->nullable()
                ->after('institution_name')
                ->comment('Alamat domisili lengkap peserta');
            $table->string('guardian_name')
                ->nullable()
                ->after('campus_supervisor')
                ->comment('Nama penanggung jawab / wali peserta');
            $table->string('photo_path', 500)
                ->nullable()
                ->after('skills')
                ->comment('Path pas foto pada disk privat local');
        });
    }

    public function down(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->dropColumn(['nis', 'address', 'guardian_name', 'photo_path']);
        });
    }
};
