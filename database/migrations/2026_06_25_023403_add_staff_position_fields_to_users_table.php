<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_staff')->default(false)->after('referral_count');
            $table->string('staff_position')->nullable()->after('is_staff');
            $table->timestamp('staff_position_assigned_at')->nullable()->after('staff_position');
            $table->foreignId('staff_position_assigned_by')->nullable()->after('staff_position_assigned_at')->constrained('users')->nullOnDelete();
            $table->string('staff_status')->nullable()->after('staff_position_assigned_by');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('staff_position_assigned_by');
            $table->dropColumn([
                'is_staff',
                'staff_position',
                'staff_position_assigned_at',
                'staff_status',
            ]);
        });
    }
};
