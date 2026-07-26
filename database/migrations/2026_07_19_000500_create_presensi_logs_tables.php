<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Revisi #22: Log Presensi Harian peserta magang.
 * Input: tanggal (bebas pilih), jam mulai/selesai, rincian aktivitas, dan
 * lampiran (boleh lebih dari satu — tabel presensi_attachments, disk privat).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presensi_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('activity_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->text('details');
            $table->timestamps();

            $table->index(['user_id', 'activity_date']);
        });

        Schema::create('presensi_attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('presensi_log_id')->constrained('presensi_logs')->cascadeOnDelete();
            $table->string('path')->comment('Lokasi berkas pada disk privat local');
            $table->string('original_name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presensi_attachments');
        Schema::dropIfExists('presensi_logs');
    }
};
