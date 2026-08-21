<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('avatar_path', 2048)->nullable()->change();
            $table->string('banner_path', 2048)->nullable()->change();
        });

        Schema::table('leagues', function (Blueprint $table): void {
            $table->string('logo', 2048)->nullable()->change();
        });

        Schema::table('clubs', function (Blueprint $table): void {
            $table->string('logo', 2048)->nullable()->change();
        });

        Schema::table('jerseys', function (Blueprint $table): void {
            $table->string('image', 2048)->nullable()->change();
        });

        Schema::table('post_media', function (Blueprint $table): void {
            $table->string('path', 2048)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('avatar_path')->nullable()->change();
            $table->string('banner_path')->nullable()->change();
        });

        Schema::table('leagues', function (Blueprint $table): void {
            $table->string('logo')->nullable()->change();
        });

        Schema::table('clubs', function (Blueprint $table): void {
            $table->string('logo')->nullable()->change();
        });

        Schema::table('jerseys', function (Blueprint $table): void {
            $table->string('image')->nullable()->change();
        });

        Schema::table('post_media', function (Blueprint $table): void {
            $table->string('path')->change();
        });
    }
};
