<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->foreignId('acceptance_signer_id')->nullable()->after('opd_decision_at')->constrained('opd_signers')->nullOnDelete();
            $table->string('acceptance_signer_name')->nullable()->after('acceptance_signer_id');
            $table->string('acceptance_signer_title')->nullable()->after('acceptance_signer_name');
            $table->string('acceptance_signer_nip', 50)->nullable()->after('acceptance_signer_title');
            $table->string('acceptance_draft_path', 500)->nullable()->after('surat_penerimaan_path');
            $table->string('acceptance_signed_path', 500)->nullable()->after('acceptance_draft_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('internship_applications', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('acceptance_signer_id');
            $table->dropColumn(['acceptance_signer_name', 'acceptance_signer_title', 'acceptance_signer_nip', 'acceptance_draft_path', 'acceptance_signed_path']);
        });
    }
};
