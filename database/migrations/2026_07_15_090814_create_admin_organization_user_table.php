<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('admin_organization_user')) {
            return;
        }

        Schema::create('admin_organization_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['admin_organization_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_organization_user');
    }
};
