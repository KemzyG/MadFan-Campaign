<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('favourite_club_id')
                ->nullable()
                ->after('club')
                ->constrained('clubs')
                ->nullOnDelete();
            $table->string('bio', 160)->nullable()->after('handle');
            $table->string('banner_path')->nullable()->after('avatar_path');
            $table->timestamp('social_onboarded_at')->nullable()->after('email_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('favourite_club_id');
            $table->dropColumn(['bio', 'banner_path', 'social_onboarded_at']);
        });
    }
};
