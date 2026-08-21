<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_assets', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('alt_text')->nullable();
            $table->string('path', 2048);
            $table->string('cloudinary_public_id')->nullable()->index();
            $table->string('source', 32)->default('upload')->index();
            $table->text('prompt')->nullable();
            $table->string('mime_type', 128)->nullable();
            $table->unsignedInteger('bytes')->nullable();
            $table->unsignedSmallInteger('width')->nullable();
            $table->unsignedSmallInteger('height')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_assets');
    }
};
