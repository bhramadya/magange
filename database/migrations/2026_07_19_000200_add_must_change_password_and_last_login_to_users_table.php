<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R10/R12: dukungan akun admin auto-generate + audit login.
 *  - must_change_password : admin (OPD/verifikator) dengan password acak wajib
 *    menggantinya saat login pertama (middleware password.changed).
 *  - last_login_at        : ditampilkan di Kelola User / Kelola Admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('must_change_password')->default(false)->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('must_change_password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['must_change_password', 'last_login_at']);
        });
    }
};
