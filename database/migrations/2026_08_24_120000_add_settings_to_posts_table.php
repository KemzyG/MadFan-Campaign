<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('visibility', 12)->default('public')->after('type');
            $table->string('reply_scope', 12)->default('everyone')->after('visibility');
            $table->foreignId('stage_id')->nullable()->after('club_id')
                ->constrained('stages')->nullOnDelete();

            $table->index('visibility');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['stage_id']);
            $table->dropColumn(['stage_id']);
            $table->dropIndex(['visibility']);
            $table->dropColumn(['visibility', 'reply_scope']);
        });
    }
};
