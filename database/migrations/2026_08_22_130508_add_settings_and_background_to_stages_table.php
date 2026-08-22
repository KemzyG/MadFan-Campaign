<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stages', function (Blueprint $table) {
            $table->text('description')->nullable()->after('title');
            $table->boolean('is_public')->default(true)->after('description');
            $table->boolean('allow_invite')->default(true)->after('is_public');
            $table->boolean('allow_chat')->default(true)->after('allow_invite');
            $table->boolean('allow_speak_requests')->default(true)->after('allow_chat');
            $table->unsignedTinyInteger('background_key')->default(1)->after('allow_speak_requests');

            $table->index(['status', 'is_public', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::table('stages', function (Blueprint $table) {
            $table->dropIndex(['status', 'is_public', 'started_at']);
            $table->dropColumn([
                'description',
                'is_public',
                'allow_invite',
                'allow_chat',
                'allow_speak_requests',
                'background_key',
            ]);
        });
    }
};
