<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jersey_media_asset', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jersey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_asset_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['jersey_id', 'media_asset_id']);
            $table->index(['jersey_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jersey_media_asset');
    }
};
