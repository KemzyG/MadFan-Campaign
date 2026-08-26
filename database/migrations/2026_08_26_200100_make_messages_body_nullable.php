<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A message can now be attachment-only (see add_media_to_messages_table) —
 * the original migration made `body` NOT NULL, which the DB itself would
 * reject even though the app layer already allows it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->text('body')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->text('body')->nullable(false)->change();
        });
    }
};
