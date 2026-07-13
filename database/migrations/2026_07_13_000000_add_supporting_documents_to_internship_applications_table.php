<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Berkas pendukung OPSIONAL yang diunggah peserta saat mendaftar
     * (welcome #daftar): Surat Pengantar, CV, dan Portofolio — semua "jika ada".
     * Mengikuti pola photo_path (kolom path pada tabel ini, disk privat `local`)
     * agar tidak membuat sistem penyimpanan paralel.
     */
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->string('surat_pengantar_path', 500)
                ->nullable()
                ->after('photo_path')
                ->comment('Berkas Surat Pengantar (opsional, disk privat local)');
            $table->string('cv_path', 500)
                ->nullable()
                ->after('surat_pengantar_path')
                ->comment('Berkas CV (opsional, disk privat local)');
            $table->string('portfolio_path', 500)
                ->nullable()
                ->after('cv_path')
                ->comment('Berkas Portofolio (opsional, disk privat local)');
        });
    }

    public function down(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->dropColumn(['surat_pengantar_path', 'cv_path', 'portfolio_path']);
        });
    }
};
