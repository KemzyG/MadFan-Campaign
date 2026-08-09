<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Mid-rename leftovers (Spaces → Base → Fandom → Stage).
 * Canonical tables are stages / stage_*.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            'space_signals',
            'space_messages',
            'space_participants',
            'spaces',
            'fandom_signals',
            'fandom_messages',
            'fandom_participants',
            'fandoms',
            'base_signals',
            'base_messages',
            'base_participants',
            'bases',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }

    public function down(): void
    {
        // Intentionally empty — legacy rename tables are not restored.
    }
};
