<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel inti sistem: form pengajuan + penempatan + keputusan OPD.
     *
     * Status flow:
     *   pending_verifikator → forwarded_opd → approved/rejected
     *   → ongoing → completion_submitted → completed
     */
    public function up(): void
    {
        Schema::create('internship_applications', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 30)
                  ->unique()
                  ->comment('Auto-gen: MGG-2025-0001');

            // ── Pemohon ──────────────────────────────────────────────
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // ── Data pengajuan ────────────────────────────────────────
            $table->text('tujuan_magang')
                  ->comment('Bidang/minat yg diinginkan mahasiswa');
            $table->tinyInteger('duration_months')->unsigned();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('institution_name')
                  ->comment('Asal kampus / instansi');
            $table->string('campus_supervisor')
                  ->comment('Dosen pembimbing');

            // ── Status & alur ─────────────────────────────────────────
            $table->enum('status', [
                'pending_verifikator',
                'forwarded_opd',
                'approved',
                'rejected',
                'ongoing',
                'completion_submitted',
                'completed',
            ])->default('pending_verifikator');

            // ── Data penempatan (diisi Admin Verifikator saat forward) ─
            $table->foreignId('opd_id')
                  ->nullable()
                  ->constrained('opds')
                  ->nullOnDelete()
                  ->comment('Diisi Admin Verifikator saat forward');
            $table->string('division')
                  ->nullable()
                  ->comment('Bidang penempatan di OPD');
            $table->string('field_supervisor')
                  ->nullable()
                  ->comment('Pembimbing lapangan OPD');
            $table->string('person_in_charge')
                  ->nullable()
                  ->comment('Penanggung jawab OPD');

            // ── Aksi Admin Verifikator ────────────────────────────────
            $table->foreignId('forwarded_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->comment('Admin Verifikator yg memforward');
            $table->timestamp('forwarded_at')->nullable();

            // ── Aksi Admin OPD ────────────────────────────────────────
            $table->foreignId('opd_decision_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->comment('Admin OPD yg ACC / Tolak');
            $table->timestamp('opd_decision_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            // Composite index untuk filter dashboard per OPD & status
            $table->index(['opd_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internship_applications');
    }
};
