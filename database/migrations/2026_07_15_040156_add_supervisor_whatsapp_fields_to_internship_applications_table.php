<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->string('campus_supervisor_whatsapp', 20)
                ->nullable()
                ->after('campus_supervisor')
                ->comment('Nomor WA dosen/guru pembimbing');
            $table->string('guardian_whatsapp', 20)
                ->nullable()
                ->after('guardian_name')
                ->comment('Nomor WA penanggung jawab/wali peserta');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->dropColumn(['campus_supervisor_whatsapp', 'guardian_whatsapp']);
        });
    }
};
