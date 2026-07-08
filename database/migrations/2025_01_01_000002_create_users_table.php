<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Semua pengguna: mahasiswa & semua admin.
     *
     * CATATAN: File ini menggantikan migration users bawaan Laravel.
     * Hapus / rename migration default:
     *   database/migrations/0001_01_01_000000_create_users_table.php
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('whatsapp_number', 20)->nullable();
            $table->text('password')
                ->nullable()
                ->comment('Hash OTP aktif – diupdate tiap sesi login');
            $table->enum('role', ['mahasiswa', 'admin_verifikator', 'admin_opd']);
            $table->foreignId('opd_id')
                ->nullable()
                ->comment('Hanya untuk role admin_opd')
                ->constrained('opds')
                ->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
