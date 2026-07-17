<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Lockout progresif login OTP. Setelah 3x salah input, user wajib kirim
     * ulang; jeda kirim ulang naik mengikuti deret Fibonacci per tingkat
     * lockout (1,1,2,3,5,8… menit). Reset saat login sukses ATAU 24 jam tanpa
     * percobaan (mana lebih dulu). Satu baris per user.
     */
    public function up(): void
    {
        Schema::create('otp_lockouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('failed_attempts')
                ->default(0)
                ->comment('Jumlah salah input OTP sejak lockout terakhir');
            $table->unsignedTinyInteger('lockout_level')
                ->default(0)
                ->comment('Tingkat lockout → indeks deret Fibonacci untuk jeda');
            $table->timestamp('locked_until')
                ->nullable()
                ->comment('Kirim ulang OTP diblokir hingga waktu ini');
            $table->timestamp('last_attempt_at')
                ->nullable()
                ->comment('Percobaan terakhir; dipakai untuk reset otomatis 24 jam');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_lockouts');
    }
};
