<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_stage_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stage_id')->constrained('live_stages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('body', 280);
            $table->timestamp('deleted_at')->nullable();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['live_stage_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_stage_comments');
    }
};
