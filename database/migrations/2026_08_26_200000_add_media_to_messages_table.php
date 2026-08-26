<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->string('media_path')->nullable()->after('body');
            $table->string('media_type', 8)->nullable()->after('media_path');
            $table->unsignedInteger('media_width')->nullable()->after('media_type');
            $table->unsignedInteger('media_height')->nullable()->after('media_width');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropColumn(['media_path', 'media_type', 'media_width', 'media_height']);
        });
    }
};
