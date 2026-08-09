<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->string('role', 32)->default('member');
            $table->string('notifications', 32)->default('all');
            $table->timestamps();

            $table->unique(['user_id', 'club_id']);
            $table->index(['club_id', 'is_primary']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_memberships');
    }
};
