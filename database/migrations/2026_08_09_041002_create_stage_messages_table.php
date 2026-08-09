<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_id')->constrained('stages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('body', 280);
            $table->timestamps();

            $table->index(['stage_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_messages');
    }
};
