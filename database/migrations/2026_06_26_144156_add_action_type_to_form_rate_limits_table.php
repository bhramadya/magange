<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tambah action_type agar rate-limiter bisa dipakai lintas aksi
     * (mis. 'otp_request', 'submit_pengajuan'), bukan hanya per identifier.
     */
    public function up(): void
    {
        Schema::table('form_rate_limits', function (Blueprint $table) {
            $table->string('action_type', 50)
                ->nullable()
                ->after('identifier_type')
                ->comment('Jenis aksi yang dibatasi, mis. otp_request');

            // Index untuk query rate-limiting per identifier + aksi.
            $table->index(['identifier', 'action_type', 'submitted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_rate_limits', function (Blueprint $table) {
            $table->dropIndex(['identifier', 'action_type', 'submitted_at']);
            $table->dropColumn('action_type');
        });
    }
};
