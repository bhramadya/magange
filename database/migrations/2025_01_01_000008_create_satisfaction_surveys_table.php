<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Survei wajib – kunci untuk download sertifikat (1:1 per tiket).
     */
    public function up(): void
    {
        Schema::create('satisfaction_surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')
                  ->unique()
                  ->comment('1:1 per tiket')
                  ->constrained('internship_applications')
                  ->cascadeOnDelete();
            $table->tinyInteger('rating')
                  ->unsigned()
                  ->comment('1–5 bintang');
            $table->text('comment')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('satisfaction_surveys');
    }
};
