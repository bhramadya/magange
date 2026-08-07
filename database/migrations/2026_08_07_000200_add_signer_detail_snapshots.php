<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R3a — snapshot untuk variabel penandatangan baru.
 *
 * Invarian TTE (CLAUDE.md): dokumen yang sudah terbit harus tetap menyebut
 * pejabat yang BENAR-BENAR menandatanganinya, jadi setiap kolom penandatangan
 * baru wajib punya padanan snapshot yang ditulis SEKALI bersama snapshot lama.
 *
 * Sekalian menutup lubang surat penyelesaian (Keputusan #5): `final_reports`
 * belum punya kolom penandatangan sama sekali — blok tanda tangannya selama ini
 * hardcoded "a.n. Kepala Dinas Komunikasi dan Informatika" + garis kosong.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->string('acceptance_signer_nik', 16)->nullable()->after('acceptance_signer_nip');
            $table->string('acceptance_signer_degree_prefix', 50)->nullable()->after('acceptance_signer_nik');
            $table->string('acceptance_signer_degree_suffix', 50)->nullable()->after('acceptance_signer_degree_prefix');
            $table->string('acceptance_signer_rank', 100)->nullable()->after('acceptance_signer_degree_suffix');
            $table->string('acceptance_signer_rank_class', 20)->nullable()->after('acceptance_signer_rank');
            $table->string('acceptance_signer_on_behalf_of')->nullable()->after('acceptance_signer_rank_class');
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->string('signer_nik', 16)->nullable()->after('signer_nip');
            $table->string('signer_degree_prefix', 50)->nullable()->after('signer_nik');
            $table->string('signer_degree_suffix', 50)->nullable()->after('signer_degree_prefix');
            $table->string('signer_rank', 100)->nullable()->after('signer_degree_suffix');
            $table->string('signer_rank_class', 20)->nullable()->after('signer_rank');
            $table->string('signer_on_behalf_of')->nullable()->after('signer_rank_class');
        });

        Schema::table('final_reports', function (Blueprint $table): void {
            $table->foreignId('completion_signer_id')->nullable()->after('completion_letter_path')
                ->constrained('opd_signers')->nullOnDelete();
            $table->string('completion_signer_name')->nullable()->after('completion_signer_id');
            $table->string('completion_signer_title')->nullable()->after('completion_signer_name');
            $table->string('completion_signer_nip', 50)->nullable()->after('completion_signer_title');
            $table->string('completion_signer_nik', 16)->nullable()->after('completion_signer_nip');
            $table->string('completion_signer_degree_prefix', 50)->nullable()->after('completion_signer_nik');
            $table->string('completion_signer_degree_suffix', 50)->nullable()->after('completion_signer_degree_prefix');
            $table->string('completion_signer_rank', 100)->nullable()->after('completion_signer_degree_suffix');
            $table->string('completion_signer_rank_class', 20)->nullable()->after('completion_signer_rank');
            $table->string('completion_signer_on_behalf_of')->nullable()->after('completion_signer_rank_class');
        });
    }

    public function down(): void
    {
        Schema::table('final_reports', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('completion_signer_id');
            $table->dropColumn([
                'completion_signer_name',
                'completion_signer_title',
                'completion_signer_nip',
                'completion_signer_nik',
                'completion_signer_degree_prefix',
                'completion_signer_degree_suffix',
                'completion_signer_rank',
                'completion_signer_rank_class',
                'completion_signer_on_behalf_of',
            ]);
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropColumn([
                'signer_nik',
                'signer_degree_prefix',
                'signer_degree_suffix',
                'signer_rank',
                'signer_rank_class',
                'signer_on_behalf_of',
            ]);
        });

        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->dropColumn([
                'acceptance_signer_nik',
                'acceptance_signer_degree_prefix',
                'acceptance_signer_degree_suffix',
                'acceptance_signer_rank',
                'acceptance_signer_rank_class',
                'acceptance_signer_on_behalf_of',
            ]);
        });
    }
};
