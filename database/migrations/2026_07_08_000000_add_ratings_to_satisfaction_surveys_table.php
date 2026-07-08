<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Simpan rincian rating per-pertanyaan survei kepuasan (5 aspek) sebagai JSON.
 * Kolom `rating` yang ada tetap dipakai sebagai nilai agregat (rata-rata) untuk
 * testimonial & tampilan ringkas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('satisfaction_surveys', function (Blueprint $table) {
            $table->json('ratings')
                ->nullable()
                ->after('rating')
                ->comment('Rating per-pertanyaan {aspek: 1-5}');
        });
    }

    public function down(): void
    {
        Schema::table('satisfaction_surveys', function (Blueprint $table) {
            $table->dropColumn('ratings');
        });
    }
};
