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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('shootout_losses_today')->default(0)->after('shootout_last_awarded_at');
            $table->date('shootout_stats_date')->nullable()->after('shootout_losses_today');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['shootout_losses_today', 'shootout_stats_date']);
        });
    }
};
