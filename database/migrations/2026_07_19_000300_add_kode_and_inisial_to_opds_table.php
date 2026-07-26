<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R11: kode_opd (angka, internal) + inisial_opd (string, publik).
 * Kolom `code` lama TIDAK dihapus — masih dipakai banyak halaman.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opds', function (Blueprint $table): void {
            $table->integer('kode_opd')->nullable()->unique()->after('code')
                ->comment('Kode internal berupa angka (R11)');
            $table->string('inisial_opd', 30)->nullable()->after('kode_opd')
                ->comment('Inisial publik, mis. KOMINFO (R11)');
        });
    }

    public function down(): void
    {
        Schema::table('opds', function (Blueprint $table): void {
            $table->dropColumn(['kode_opd', 'inisial_opd']);
        });
    }
};
