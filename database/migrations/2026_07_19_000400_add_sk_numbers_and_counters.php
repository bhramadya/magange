<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R4/R5 + R9: Nomor SK auto-increment dengan tanggal terbit statis.
 *  - internship_applications.sk_number/sk_issued_at : SK surat penerimaan,
 *    di-set SEKALI saat OPD approve (cetak ulang tidak mengubah nilai).
 *  - final_reports.completion_sk_number/completion_sk_issued_at/
 *    completion_letter_path : SK + arsip surat penyelesaian magang.
 *  - sk_counters : counter per jenis surat ('acceptance' | 'completion');
 *    start number bisa diatur admin (mis. mulai 40).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->string('sk_number')->nullable()->unique()
                ->comment('Nomor SK surat penerimaan, mis. 503.11/21/401.106/2026');
            $table->date('sk_issued_at')->nullable()
                ->comment('Tanggal terbit SK (statis, tidak berubah saat cetak ulang)');
        });

        Schema::table('final_reports', function (Blueprint $table): void {
            $table->string('completion_sk_number')->nullable()->unique()
                ->comment('Nomor SK surat penyelesaian magang');
            $table->date('completion_sk_issued_at')->nullable()
                ->comment('Tanggal terbit SK penyelesaian (statis)');
            $table->string('completion_letter_path')->nullable()
                ->comment('Arsip PDF surat penyelesaian (disk privat)');
        });

        Schema::create('sk_counters', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 30)->unique()->comment("'acceptance' | 'completion'");
            $table->unsignedInteger('next_number')->default(1)
                ->comment('Nomor urut berikutnya; start number bisa diatur admin');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sk_counters');

        Schema::table('final_reports', function (Blueprint $table): void {
            $table->dropColumn(['completion_sk_number', 'completion_sk_issued_at', 'completion_letter_path']);
        });

        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->dropColumn(['sk_number', 'sk_issued_at']);
        });
    }
};
