<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Dokumen resmi: surat rekomendasi & surat selesai (1:N per tiket).
     * Disimpan sebagai record terpisah agar acceptance_letter dan
     * completion_letter dapat dibedakan dalam satu tiket.
     */
    public function up(): void
    {
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')
                  ->constrained('internship_applications')
                  ->cascadeOnDelete();
            $table->enum('type', ['acceptance_letter', 'completion_letter']);
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->foreignId('uploaded_by')
                  ->constrained('users')
                  ->restrictOnDelete()
                  ->comment('Admin Verifikator yang mengunggah');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['application_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_documents');
    }
};
