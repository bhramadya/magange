<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R3 / Keputusan #4 — nomor surat per OPD.
 *
 * Format nomor SK `503.11/{urut}/{kode-unit}/{tahun}` sebelumnya memakai satu
 * kode unit untuk semua OPD: `401.106` (kode Dinas Kominfo). Kolom ini membuat
 * kode unit itu milik masing-masing OPD; nilai lama dipertahankan sebagai
 * default supaya nomor yang sudah terbit tetap konsisten dengan surat cetaknya.
 *
 * Urutan nomornya sendiri dipisah per OPD di `sk_counters`
 * (`key` = "acceptance:{opd_id}"), lihat SkNumberService.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opds', function (Blueprint $table): void {
            $table->string('letter_code', 30)->default('401.106')->after('letterhead_email')
                ->comment('Kode unit pada nomor surat, mis. 401.106');
        });

        // Panjang key dinaikkan: "acceptance:{opd_id}" tidak muat di 30 karakter
        // begitu id OPD ikut disematkan.
        Schema::table('sk_counters', function (Blueprint $table): void {
            $table->string('key', 60)->change();
        });
    }

    public function down(): void
    {
        Schema::table('sk_counters', function (Blueprint $table): void {
            $table->string('key', 30)->change();
        });

        Schema::table('opds', function (Blueprint $table): void {
            $table->dropColumn('letter_code');
        });
    }
};
