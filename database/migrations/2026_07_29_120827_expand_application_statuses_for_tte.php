<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE internship_applications ALTER COLUMN status DROP DEFAULT');
            DB::statement('ALTER TABLE internship_applications ALTER COLUMN status TYPE VARCHAR(50) USING status::text');
            DB::statement("ALTER TABLE internship_applications ALTER COLUMN status SET DEFAULT 'pending_verifikator'");
        } else {
            Schema::table('internship_applications', function (Blueprint $table): void {
                $table->string('status', 50)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep the VARCHAR column on rollback so TTE rows remain readable.
    }
};
