<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Master data penempatan per OPD: bidang/divisi, pembimbing lapangan, dan
     * penanggung jawab. Ketiganya hanya berisi NAMA — mereka tidak
     * menandatangani dokumen apa pun (itu urusan `opd_signers`), jadi tak
     * perlu jabatan/NIP.
     */
    public function up(): void
    {
        Schema::create('opd_placement_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opd_id')->constrained('opds')->cascadeOnDelete();
            $table->string('type', 30)->comment('division|field_supervisor|person_in_charge');
            $table->string('name');
            $table->timestamps();
            $table->unique(['opd_id', 'type', 'name']);
            $table->index(['opd_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opd_placement_options');
    }
};
