<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Transisi status kini bisa dipicu Sistem (cron job) tanpa user — mis.
     * approved→ongoing saat tgl mulai, ongoing→completed saat tgl selesai.
     * Maka changed_by harus boleh null (NULL = perubahan oleh sistem).
     */
    public function up(): void
    {
        Schema::table('application_status_logs', function (Blueprint $table) {
            $table->foreignId('changed_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('application_status_logs', function (Blueprint $table) {
            $table->foreignId('changed_by')->nullable(false)->change();
        });
    }
};
