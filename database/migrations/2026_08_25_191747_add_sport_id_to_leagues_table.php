<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leagues', function (Blueprint $table) {
            $table->foreignId('sport_id')
                ->nullable()
                ->after('id')
                ->constrained('sports')
                ->nullOnDelete();
        });

        $footballId = DB::table('sports')->where('slug', 'football')->value('id');

        if ($footballId !== null) {
            DB::table('leagues')->whereNull('sport_id')->update(['sport_id' => $footballId]);
        }
    }

    public function down(): void
    {
        Schema::table('leagues', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sport_id');
        });
    }
};
