<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email_normalized')->nullable()->after('email');
            $table->string('registration_fingerprint', 64)->nullable()->after('token_version');
            $table->string('registration_ip', 45)->nullable()->after('registration_fingerprint');
            $table->text('registration_user_agent')->nullable()->after('registration_ip');

            $table->unique('email_normalized');
            $table->unique('registration_fingerprint');
            $table->index('registration_ip');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email_normalized']);
            $table->dropUnique(['registration_fingerprint']);
            $table->dropIndex(['registration_ip']);
            $table->dropColumn([
                'email_normalized',
                'registration_fingerprint',
                'registration_ip',
                'registration_user_agent',
            ]);
        });
    }
};
