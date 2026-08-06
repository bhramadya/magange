<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Migration 2026_07_29_120827 melebarkan kolom status jadi VARCHAR(50) agar
     * status TTE baru (waiting_tte, needs_certificate) muat — tetapi di
     * PostgreSQL `ALTER COLUMN ... TYPE` TIDAK ikut membuang CHECK constraint
     * bawaan `$table->enum()`. Constraint lama masih hanya mengizinkan 7 status
     * pra-TTE, sehingga setiap transisi ke waiting_tte/needs_certificate ditolak
     * database (SQLSTATE 23514) — alur TTE mati total di PostgreSQL.
     *
     * Constraint dibuang (bukan dibuat ulang berisi 9 status) mengikuti niat
     * 120827 yang memang memindahkan kolom ini ke VARCHAR biasa: daftar status
     * yang sah dijaga di level aplikasi oleh cast App\Enums\ApplicationStatus,
     * jadi penambahan status berikutnya tak lagi butuh migration constraint —
     * dan tak bisa lagi menimbulkan kegagalan senyap seperti ini.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            // Driver lain (SQLite di suite lokal) sudah membangun ulang tabel
            // lewat `->change()` di 120827, jadi tak ada constraint sisa.
            return;
        }

        DB::statement('ALTER TABLE internship_applications DROP CONSTRAINT IF EXISTS internship_applications_status_check');
    }

    public function down(): void
    {
        // Tidak dibuat ulang: mengembalikan daftar 7 status akan membuat baris
        // TTE yang sudah ada melanggar constraint dan rollback gagal.
    }
};
