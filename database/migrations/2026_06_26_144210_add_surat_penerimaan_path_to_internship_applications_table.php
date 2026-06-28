<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Path file PDF surat penerimaan magang yang digenerate saat OPD menyetujui.
     */
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->string('surat_penerimaan_path', 500)
                ->nullable()
                ->after('rejection_reason')
                ->comment('Path PDF surat penerimaan di disk privat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('internship_applications', function (Blueprint $table) {
            $table->dropColumn('surat_penerimaan_path');
        });
    }
};
