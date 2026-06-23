<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Anti-spam: batasi pengiriman form publik berdasarkan IP & identifier.
     *
     * CATATAN: Tabel ini bisa di-swap dengan Redis/cache Laravel
     * untuk performa lebih tinggi di production.
     */
    public function up(): void
    {
        Schema::create('form_rate_limits', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address', 45)
                  ->comment('Mendukung IPv4 & IPv6');
            $table->string('identifier')
                  ->comment('Email atau nomor WhatsApp');
            $table->enum('identifier_type', ['email', 'whatsapp']);
            $table->timestamp('submitted_at');

            // Index untuk query rate-limiting yang efisien
            $table->index(['ip_address', 'submitted_at']);
            $table->index(['identifier', 'identifier_type', 'submitted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_rate_limits');
    }
};
