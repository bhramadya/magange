<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Foto profil pengguna. Untuk mahasiswa otomatis diisi dari pas foto yang
     * diunggah saat mendaftar (welcome #daftar) — tanpa langkah unggah terpisah.
     * Path menunjuk berkas pada disk privat `local` (sama seperti photo_path
     * pengajuan), disajikan lewat route terproteksi `profile.avatar`.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_path', 500)
                ->nullable()
                ->after('whatsapp_number')
                ->comment('Foto profil (disk privat local); mahasiswa terisi dari pas foto pendaftaran');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar_path');
        });
    }
};
