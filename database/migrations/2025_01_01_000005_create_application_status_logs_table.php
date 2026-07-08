<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Audit trail setiap perubahan status tiket.
     */
    public function up(): void
    {
        Schema::create('application_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')
                ->constrained('internship_applications')
                ->cascadeOnDelete();
            $table->string('from_status', 50)
                ->nullable()
                ->comment('null pada entri pertama (status awal)');
            $table->string('to_status', 50);
            $table->foreignId('changed_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Index untuk mempercepat riwayat per tiket
            $table->index(['application_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_status_logs');
    }
};
