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
        Schema::table('certificates', function (Blueprint $table): void {
            $table->string('draft_path', 500)->nullable()->after('file_path');
            $table->foreignId('signer_id')->nullable()->after('uploaded_by')->constrained('opd_signers')->nullOnDelete();
            $table->string('signer_name')->nullable()->after('signer_id');
            $table->string('signer_title')->nullable()->after('signer_name');
            $table->string('signer_nip', 50)->nullable()->after('signer_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('signer_id');
            $table->dropColumn(['draft_path', 'signer_name', 'signer_title', 'signer_nip']);
        });
    }
};
