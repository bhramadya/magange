<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Laporan akhir magang yang diunggah mahasiswa (1:1 per tiket).
     */
    public function up(): void
    {
        Schema::create('final_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')
                  ->unique()
                  ->constrained('internship_applications')
                  ->cascadeOnDelete()
                  ->comment('1:1 per tiket');
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->boolean('is_confirmed')
                  ->default(false)
                  ->comment('Checkbox "sudah selesai magang" oleh mahasiswa');
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending');
            $table->foreignId('reviewed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->comment('Admin Verifikator yang mereview');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('final_reports');
    }
};
