<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahan kolom revisi:
     *  - major, skills   : diisi peserta saat mendaftar (jurusan opsional + keahlian).
     *  - verifikator_note: catatan Admin Verifikator yg dibaca Admin OPD saat menerima.
     *
     * Catatan: division/field_supervisor/person_in_charge kini diisi Admin OPD
     * saat menyetujui (sebelumnya diisi Verifikator) — perubahan ini di sisi
     * service, kolomnya tetap.
     */
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->string('major')
                ->nullable()
                ->after('campus_supervisor')
                ->comment('Jurusan peserta (opsional)');
            $table->text('skills')
                ->nullable()
                ->after('major')
                ->comment('Keahlian/keterampilan peserta');
            $table->text('verifikator_note')
                ->nullable()
                ->after('forwarded_at')
                ->comment('Catatan Admin Verifikator utk Admin OPD');
        });
    }

    public function down(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->dropColumn(['major', 'skills', 'verifikator_note']);
        });
    }
};
