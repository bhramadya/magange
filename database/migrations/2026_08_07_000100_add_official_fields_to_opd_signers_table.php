<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R3a — variabel penandatangan surat yang lebih lengkap.
 *
 * Semua kolom nullable: baris penandatangan yang sudah tersimpan (dan seeder
 * lama) hanya punya nama/jabatan/NIP, dan surat tetap harus bisa terbit tanpa
 * data tambahan ini.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opd_signers', function (Blueprint $table): void {
            $table->string('nik', 16)->nullable()->after('nip')
                ->comment('NIK penandatangan (16 digit), opsional');
            $table->string('degree_prefix', 50)->nullable()->after('name')
                ->comment('Gelar depan, mis. "Dr." / "Ir."');
            $table->string('degree_suffix', 50)->nullable()->after('degree_prefix')
                ->comment('Gelar belakang, mis. "S.Kom., M.M."');
            $table->string('rank', 100)->nullable()->after('title')
                ->comment('Pangkat, mis. "Pembina Tingkat I"');
            $table->string('rank_class', 20)->nullable()->after('rank')
                ->comment('Golongan, mis. "IV/b"');
            $table->string('on_behalf_of')->nullable()->after('rank_class')
                ->comment('Keterangan mewakili, mis. "a.n. Kepala Dinas Kominfo"');
        });
    }

    public function down(): void
    {
        Schema::table('opd_signers', function (Blueprint $table): void {
            $table->dropColumn([
                'nik',
                'degree_prefix',
                'degree_suffix',
                'rank',
                'rank_class',
                'on_behalf_of',
            ]);
        });
    }
};
