<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Token OTP untuk login tanpa password tetap.
     */
    public function up(): void
    {
        Schema::create('otp_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('token_hash')
                ->comment('bcrypt dari OTP 6 digit');
            $table->timestamp('expires_at');
            $table->timestamp('used_at')
                ->nullable()
                ->comment('null = belum digunakan');
            $table->timestamp('created_at')->useCurrent();

            // Index untuk mempercepat lookup token aktif per user
            $table->index(['user_id', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_tokens');
    }
};
