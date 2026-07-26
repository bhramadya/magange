<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Batch 5 revisi #5: presensi berubah dari "log aktivitas" (tanggal + jam
 * bebas) menjadi "absen harian": status hadir/izin/sakit, tanggal otomatis
 * (hari ini), maksimal 1x per hari (unique user_id+activity_date), jam absen
 * dibaca dari created_at. Kolom jam lama dibiarkan (nullable) agar data
 * historis tetap utuh; entri baru tidak mengisinya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensi_logs', function (Blueprint $table): void {
            $table->string('status')->default('hadir')->after('activity_date');
            $table->time('start_time')->nullable()->change();
            $table->time('end_time')->nullable()->change();
            $table->unique(['user_id', 'activity_date']);
        });
    }

    public function down(): void
    {
        Schema::table('presensi_logs', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'activity_date']);
            $table->dropColumn('status');
            $table->time('start_time')->nullable(false)->change();
            $table->time('end_time')->nullable(false)->change();
        });
    }
};
