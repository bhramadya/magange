<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Revisi #16: kolom Penanggung Jawab (guardian_name + guardian_whatsapp)
 * dihapus dari form pendaftaran publik — ikut dihapus dari tabel.
 * (person_in_charge penempatan OPD TIDAK terpengaruh — itu kolom lain.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->dropColumn(['guardian_name', 'guardian_whatsapp']);
        });
    }

    public function down(): void
    {
        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->string('guardian_name')->nullable()
                ->comment('Nama penanggung jawab / wali (dihapus revisi #16)');
            $table->string('guardian_whatsapp', 20)->nullable()
                ->comment('No. WA penanggung jawab (dihapus revisi #16)');
        });
    }
};
