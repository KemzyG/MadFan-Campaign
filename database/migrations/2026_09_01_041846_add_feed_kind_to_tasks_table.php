<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Which Events-feed card a task renders as: "challenge" (the existing
     * fan_challenge card) or "campaign" (was auto-generated off the active
     * Season; now just another admin-authored task, distinguished only by
     * this). Defaults to "challenge" so every existing row keeps behaving
     * exactly as it did before this column existed.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('feed_kind')->default('challenge')->after('task_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('feed_kind');
        });
    }
};
