<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('admin_organizations')) {
            throw new RuntimeException(
                'Missing admin_organizations table. Ensure 2026_07_15_090812 runs before this migration.'
            );
        }

        if (! Schema::hasColumn('users', 'current_admin_organization_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('current_admin_organization_id')
                    ->nullable()
                    ->after('token_version');
            });
        }

        if ($this->usersHaveOrganizationForeignKey()) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('current_admin_organization_id', 'users_current_admin_organization_id_foreign')
                ->references('id')
                ->on('admin_organizations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'current_admin_organization_id')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if ($this->usersHaveOrganizationForeignKey()) {
                $table->dropForeign('users_current_admin_organization_id_foreign');
            }

            $table->dropColumn('current_admin_organization_id');
        });
    }

    private function usersHaveOrganizationForeignKey(): bool
    {
        return collect(Schema::getForeignKeys('users'))
            ->contains(function (array $foreignKey): bool {
                return ($foreignKey['name'] ?? null) === 'users_current_admin_organization_id_foreign'
                    || in_array('current_admin_organization_id', $foreignKey['columns'] ?? [], true);
            });
    }
};
