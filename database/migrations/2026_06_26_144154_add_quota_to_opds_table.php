<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Kuota penerimaan peserta magang per OPD.
     * quota_used di-increment saat Admin OPD menyetujui pengajuan.
     */
    public function up(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            $table->unsignedInteger('quota_total')
                ->default(0)
                ->after('is_active')
                ->comment('Kapasitas total peserta magang');
            $table->unsignedInteger('quota_used')
                ->default(0)
                ->after('quota_total')
                ->comment('Jumlah peserta yang sudah disetujui');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            $table->dropColumn(['quota_total', 'quota_used']);
        });
    }
};
