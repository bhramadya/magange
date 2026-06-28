<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Sertifikat selesai magang. Diunggah Admin setelah laporan akhir
     * dikonfirmasi; awalnya terkunci (is_download_locked = true) sampai
     * di-unlock untuk diunduh mahasiswa.
     */
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')
                ->constrained('internship_applications')
                ->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->boolean('is_download_locked')
                ->default(true)
                ->comment('true = belum boleh diunduh mahasiswa');
            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->restrictOnDelete()
                ->comment('Admin yang mengunggah sertifikat');
            $table->timestamps();

            $table->index('application_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
