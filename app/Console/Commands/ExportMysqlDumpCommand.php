<?php

namespace App\Console\Commands;

use Database\Seeders\AdminPermissionsSeeder;
use Database\Seeders\EarnSourceSeeder;
use Database\Seeders\FilamentAdminSeeder;
use Database\Seeders\LoyaltyTierSeeder;
use Database\Seeders\ReferralMilestoneSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\StreakMilestoneSeeder;
use Database\Seeders\TaskSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class ExportMysqlDumpCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:export-mysql-dump
                            {--path=database/cpanel/madfan_schema.sql : Output SQL file path}
                            {--seed : Include essential seed data (roles, settings, tiers, etc.)}';

    /**
     * @var string
     */
    protected $description = 'Export a MySQL dump for cPanel/phpMyAdmin import (no SSH required)';

    public function handle(): int
    {
        $outputPath = $this->resolvePath((string) $this->option('path'));
        $includeSeed = (bool) $this->option('seed');

        File::ensureDirectoryExists(dirname($outputPath));

        $tempDb = storage_path('app/cpanel-export.sqlite');
        File::put($tempDb, '');

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => $tempDb,
        ]);
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        $this->info('Migrating temporary database...');
        Artisan::call('migrate:fresh', [
            '--database' => 'sqlite',
            '--force' => true,
            '--no-interaction' => true,
        ]);
        $this->output->write(Artisan::output());

        if ($includeSeed) {
            $this->info('Seeding essential data...');
            putenv('SEED_TEST_DATA=false');
            $_ENV['SEED_TEST_DATA'] = 'false';

            $seeders = [
                RoleSeeder::class,
                AdminPermissionsSeeder::class,
                FilamentAdminSeeder::class,
                LoyaltyTierSeeder::class,
                SeasonSeeder::class,
                StreakMilestoneSeeder::class,
                ReferralMilestoneSeeder::class,
                TaskSeeder::class,
                EarnSourceSeeder::class,
                SettingSeeder::class,
            ];

            foreach ($seeders as $seeder) {
                Artisan::call('db:seed', [
                    '--class' => $seeder,
                    '--database' => 'sqlite',
                    '--force' => true,
                    '--no-interaction' => true,
                ]);
                $this->output->write(Artisan::output());
            }
        }

        $connection = DB::connection('sqlite');
        $tables = $this->listTables($connection);

        $this->info('Converting schema to MySQL ('.count($tables).' tables)...');

        $schemaStatements = [];
        foreach ($tables as $table) {
            $schemaStatements[] = $this->convertTableToMysql($connection, $table);
        }

        $seedStatements = $includeSeed
            ? $this->exportSeedInserts($connection, $tables)
            : [];

        File::put($outputPath, $this->buildDump($schemaStatements, $seedStatements));

        File::delete($tempDb);
        DB::purge('sqlite');

        $this->info('MySQL dump written to: '.$outputPath);
        $this->line('Import this file in cPanel → phpMyAdmin → Import.');

        return self::SUCCESS;
    }

    /**
     * @return list<string>
     */
    private function listTables(mixed $connection): array
    {
        $rows = $connection->select(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        );

        return collect($rows)->pluck('name')->values()->all();
    }

    private function convertTableToMysql(mixed $connection, string $table): string
    {
        $columns = $connection->select("PRAGMA table_info(`{$table}`)");
        $foreignKeys = $connection->select("PRAGMA foreign_key_list(`{$table}`)");
        $indexes = $connection->select("PRAGMA index_list(`{$table}`)");

        $lines = [];
        $primaryColumns = [];

        foreach ($columns as $column) {
            $name = $column->name;
            $notNull = (int) $column->notnull === 1;
            $default = $column->dflt_value;
            $isPk = (int) $column->pk > 0;

            if ($isPk) {
                $primaryColumns[(int) $column->pk] = $name;
            }

            $mysqlType = $this->mapSqliteTypeToMysql($column->type, $name, $isPk && count(array_filter($columns, fn ($c) => (int) $c->pk > 0)) === 1);
            $definition = "  `{$name}` {$mysqlType}";

            if ($isPk && count(array_filter($columns, fn ($c) => (int) $c->pk > 0)) === 1 && $this->isIntegerType($column->type)) {
                $definition .= ' NOT NULL AUTO_INCREMENT';
            } else {
                $definition .= $notNull ? ' NOT NULL' : ' NULL';

                if ($default !== null) {
                    $definition .= ' DEFAULT '.$this->normalizeDefault($default, $mysqlType);
                }
            }

            $lines[] = $definition;
        }

        ksort($primaryColumns);
        if ($primaryColumns !== []) {
            $pkList = collect($primaryColumns)->map(fn ($c) => "`{$c}`")->implode(', ');
            $lines[] = "  PRIMARY KEY ({$pkList})";
        }

        foreach ($foreignKeys as $foreignKey) {
            $lines[] = sprintf(
                '  CONSTRAINT `%s_fk_%s` FOREIGN KEY (`%s`) REFERENCES `%s` (`%s`) ON DELETE %s ON UPDATE %s',
                $table,
                $foreignKey->id.'_'.$foreignKey->from,
                $foreignKey->from,
                $foreignKey->table,
                $foreignKey->to,
                strtoupper($foreignKey->on_delete ?: 'NO ACTION'),
                strtoupper($foreignKey->on_update ?: 'NO ACTION'),
            );
        }

        foreach ($indexes as $index) {
            if ((int) $index->unique === 1 && $index->name === 'sqlite_autoindex_'.$table.'_1') {
                // Often the primary key autoindex; skip if already covered.
                continue;
            }

            $indexColumns = $connection->select("PRAGMA index_info(`{$index->name}`)");
            $colNames = collect($indexColumns)->sortBy('seqno')->pluck('name')->filter()->values();

            if ($colNames->isEmpty()) {
                continue;
            }

            // Skip indexes that exactly match the primary key.
            if ($colNames->values()->all() === array_values($primaryColumns)) {
                continue;
            }

            $colList = $colNames->map(fn ($c) => "`{$c}`")->implode(', ');
            $indexName = substr(preg_replace('/[^A-Za-z0-9_]/', '_', $index->name) ?: $table.'_idx', 0, 64);

            if ((int) $index->unique === 1) {
                $lines[] = "  UNIQUE KEY `{$indexName}` ({$colList})";
            } else {
                $lines[] = "  KEY `{$indexName}` ({$colList})";
            }
        }

        return "DROP TABLE IF EXISTS `{$table}`;\nCREATE TABLE `{$table}` (\n".implode(",\n", $lines)."\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    }

    private function mapSqliteTypeToMysql(string $type, string $column, bool $singleIntegerPk): string
    {
        $type = strtolower(trim($type));

        // Strip check constraints appended by SQLite dumps.
        if (str_contains($type, 'check')) {
            $type = trim(explode('check', $type, 2)[0]);
        }

        if ($singleIntegerPk && $this->isIntegerType($type) && $column === 'id') {
            return 'BIGINT UNSIGNED';
        }

        // Foreign keys and morph IDs
        if ($this->isIntegerType($type) && (
            str_ends_with($column, '_id')
            || str_ends_with($column, '_by')
            || in_array($column, ['model_id', 'role_id', 'permission_id'], true)
        )) {
            return 'BIGINT UNSIGNED';
        }

        if (preg_match('/^varchar\((\d+)\)$/', $type, $matches)) {
            return 'VARCHAR('.$matches[1].')';
        }

        if ($type === 'varchar' || $type === 'nvarchar') {
            return match ($column) {
                'remember_token' => 'VARCHAR(100)',
                'ip_address' => 'VARCHAR(45)',
                'uuid' => 'CHAR(36)',
                'platform' => 'VARCHAR(32)',
                'guard_name' => 'VARCHAR(255)',
                'type' => 'VARCHAR(50)',
                default => 'VARCHAR(255)',
            };
        }

        return match (true) {
            $type === '' && $column === 'id' => 'BIGINT UNSIGNED',
            in_array($type, ['integer', 'int'], true) => 'INT',
            $type === 'bigint' => 'BIGINT',
            in_array($type, ['float', 'real', 'double'], true) => 'DOUBLE',
            in_array($type, ['numeric', 'decimal'], true) => 'DECIMAL(8,2)',
            in_array($type, ['tinyint', 'tinyint(1)', 'boolean', 'bool'], true) => 'TINYINT(1)',
            $type === 'text' && in_array($column, ['properties', 'metadata'], true) => 'JSON',
            $type === 'text' && $column === 'token' => 'VARCHAR(512)',
            $type === 'text' && $column === 'payload' => 'LONGTEXT',
            $type === 'text' && $column === 'exception' => 'LONGTEXT',
            $type === 'text' => 'TEXT',
            $type === 'mediumtext' => 'MEDIUMTEXT',
            $type === 'longtext' => 'LONGTEXT',
            $type === 'blob' => 'BLOB',
            $type === 'datetime' => 'DATETIME',
            $type === 'date' => 'DATE',
            $type === 'time' => 'TIME',
            $type === 'timestamp' => 'TIMESTAMP NULL',
            $type === 'json' => 'JSON',
            default => $type !== '' ? strtoupper($type) : 'TEXT',
        };
    }

    private function isIntegerType(string $type): bool
    {
        $type = strtolower($type);

        return in_array($type, ['integer', 'int', 'bigint', ''], true) || str_contains($type, 'int');
    }

    private function normalizeDefault(mixed $default, string $mysqlType): string
    {
        $default = trim((string) $default);

        if (strtoupper($default) === 'NULL') {
            return 'NULL';
        }

        if (preg_match('/^CURRENT_TIMESTAMP/i', $default)) {
            return 'CURRENT_TIMESTAMP';
        }

        // SQLite stores string defaults quoted.
        if (preg_match('/^\'(.*)\'$/s', $default, $matches)) {
            return "'".str_replace("'", "\\'", $matches[1])."'";
        }

        if (preg_match('/^"(.*)"$/s', $default, $matches)) {
            return "'".str_replace("'", "\\'", $matches[1])."'";
        }

        if (is_numeric($default)) {
            return $default;
        }

        if (str_contains(strtolower($mysqlType), 'int') || str_contains(strtolower($mysqlType), 'double') || str_contains(strtolower($mysqlType), 'decimal')) {
            return $default;
        }

        return "'".str_replace("'", "\\'", $default)."'";
    }

    /**
     * @param  list<string>  $tables
     * @return list<string>
     */
    private function exportSeedInserts(mixed $connection, array $tables): array
    {
        $preferredOrder = [
            'migrations',
            'loyalty_tiers',
            'tier_rewards',
            'seasons',
            'season_weeks',
            'earn_sources',
            'streak_milestones',
            'referral_milestones',
            'tasks',
            'task_steps',
            'permissions',
            'roles',
            'role_has_permissions',
            'users',
            'model_has_roles',
            'model_has_permissions',
            'settings',
        ];

        $ordered = array_values(array_unique([
            ...array_intersect($preferredOrder, $tables),
            ...$tables,
        ]));

        // Skip empty runtime tables. Keep users + model_has_roles for FilamentAdminSeeder.
        $skip = [
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'password_reset_tokens',
            'personal_access_tokens',
            'device_tokens',
            'passports',
            'point_transactions',
            'user_task_progress',
            'weekly_progress',
            'daily_claims',
            'streaks',
            'season_claim_histories',
            'referrals',
            'user_referral_milestones',
            'leaderboard_snapshots',
            'leaderboard_entries',
            'waitlists',
            'idempotency_keys',
            'activity_logs',
            'social_accounts',
            'model_has_permissions',
        ];

        $statements = [];

        foreach ($ordered as $table) {
            if (in_array($table, $skip, true)) {
                continue;
            }

            if (! Schema::connection($connection->getName())->hasTable($table)) {
                continue;
            }

            $rows = $connection->table($table)->get();
            if ($rows->isEmpty()) {
                continue;
            }

            $columns = array_keys((array) $rows->first());
            $columnList = collect($columns)->map(fn (string $c): string => '`'.$c.'`')->implode(', ');

            foreach ($rows as $row) {
                $values = [];
                foreach ($columns as $column) {
                    $values[] = $this->quoteValue($row->{$column});
                }

                $statements[] = sprintf(
                    'INSERT INTO `%s` (%s) VALUES (%s);',
                    $table,
                    $columnList,
                    implode(', ', $values)
                );
            }
        }

        return $statements;
    }

    /**
     * @param  list<string>  $schemaStatements
     * @param  list<string>  $seedStatements
     */
    private function buildDump(array $schemaStatements, array $seedStatements): string
    {
        $lines = [
            '-- MadFan MySQL dump for cPanel / phpMyAdmin',
            '-- Generated: '.now()->toDateTimeString(),
            '-- Import into an empty database created in cPanel → MySQL® Databases',
            '',
            'SET NAMES utf8mb4;',
            'SET FOREIGN_KEY_CHECKS = 0;',
            'SET SQL_MODE = \'NO_AUTO_VALUE_ON_ZERO\';',
            'SET time_zone = \'+00:00\';',
            '',
        ];

        foreach ($schemaStatements as $statement) {
            $lines[] = $statement;
            $lines[] = '';
        }

        if ($seedStatements !== []) {
            $lines[] = '-- Seed data';
            $lines[] = '';
            foreach ($seedStatements as $statement) {
                $lines[] = $statement;
            }
            $lines[] = '';
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;';
        $lines[] = '';

        return implode("\n", $lines);
    }

    private function quoteValue(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return "'".str_replace(['\\', "'"], ['\\\\', "\\'"], (string) $value)."'";
    }

    private function resolvePath(string $relative): string
    {
        if (str_starts_with($relative, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\\/]/', $relative) === 1) {
            return $relative;
        }

        return base_path($relative);
    }
}
