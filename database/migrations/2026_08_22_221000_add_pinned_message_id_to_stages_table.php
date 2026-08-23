<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stages', function (Blueprint $table) {
            $table->foreignId('pinned_message_id')
                ->nullable()
                ->after('background_key')
                ->constrained('stage_messages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pinned_message_id');
        });
    }
};
