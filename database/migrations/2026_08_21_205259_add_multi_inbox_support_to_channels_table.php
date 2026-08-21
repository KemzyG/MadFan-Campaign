<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->string('scope', 16)->default('club')->after('club_server_id');
            $table->string('conversation_key', 64)->nullable()->unique()->after('scope');
            $table->foreignId('created_by_id')->nullable()->after('conversation_key')->constrained('users')->nullOnDelete();
            $table->index('scope');
        });

        Schema::table('channels', function (Blueprint $table) {
            $table->dropForeign(['club_server_id']);
        });

        Schema::table('channels', function (Blueprint $table) {
            $table->foreignId('club_server_id')->nullable()->change();
        });

        Schema::table('channels', function (Blueprint $table) {
            $table->foreign('club_server_id')
                ->references('id')
                ->on('club_servers')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->dropForeign(['club_server_id']);
            $table->dropConstrainedForeignId('created_by_id');
            $table->dropUnique(['conversation_key']);
            $table->dropIndex(['scope']);
            $table->dropColumn(['scope', 'conversation_key']);
        });

        Schema::table('channels', function (Blueprint $table) {
            $table->foreignId('club_server_id')->nullable(false)->change();
        });

        Schema::table('channels', function (Blueprint $table) {
            $table->foreign('club_server_id')
                ->references('id')
                ->on('club_servers')
                ->cascadeOnDelete();
        });
    }
};
