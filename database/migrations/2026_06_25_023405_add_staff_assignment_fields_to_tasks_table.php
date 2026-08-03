<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('audience')->default('fan')->after('task_type');
            $table->string('staff_position')->nullable()->after('audience');
            $table->foreignId('assigned_user_id')->nullable()->after('staff_position')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_user_id');
            $table->dropColumn(['audience', 'staff_position']);
        });
    }
};
