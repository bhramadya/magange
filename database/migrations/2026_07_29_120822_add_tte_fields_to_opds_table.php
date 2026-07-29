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
        Schema::table('opds', function (Blueprint $table): void {
            $table->text('letterhead_address')->nullable()->after('description');
            $table->string('letterhead_phone', 50)->nullable()->after('letterhead_address');
            $table->string('letterhead_email')->nullable()->after('letterhead_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('opds', function (Blueprint $table): void {
            $table->dropColumn(['letterhead_address', 'letterhead_phone', 'letterhead_email']);
        });
    }
};
