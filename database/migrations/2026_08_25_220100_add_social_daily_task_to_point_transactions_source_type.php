<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var list<string>
     */
    private const SOURCE_TYPES = [
        'task',
        'daily_claim',
        'referral',
        'bonus',
        'club_pick',
        'admin_adjustment',
        'penalty_shootout',
        'social_post',
        'social_reply',
        'social_like_received',
        'social_chat',
        'social_matchday_bonus',
        'social_daily_task',
    ];

    /**
     * @var list<string>
     */
    private const SOURCE_TYPES_WITHOUT_DAILY_TASK = [
        'task',
        'daily_claim',
        'referral',
        'bonus',
        'club_pick',
        'admin_adjustment',
        'penalty_shootout',
        'social_post',
        'social_reply',
        'social_like_received',
        'social_chat',
        'social_matchday_bonus',
    ];

    public function up(): void
    {
        $this->apply(self::SOURCE_TYPES);
    }

    public function down(): void
    {
        $this->apply(self::SOURCE_TYPES_WITHOUT_DAILY_TASK);
    }

    /**
     * @param  list<string>  $sourceTypes
     */
    private function apply(array $sourceTypes): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite stores enum as a CHECK constraint; MODIFY ENUM is MySQL-only.
            Schema::table('point_transactions', function (Blueprint $table) use ($sourceTypes): void {
                $table->enum('source_type', $sourceTypes)->change();
            });

            return;
        }

        if ($driver === 'mysql') {
            $values = collect($sourceTypes)
                ->map(fn (string $value): string => "'{$value}'")
                ->implode(",\n            ");

            DB::statement("ALTER TABLE point_transactions MODIFY source_type ENUM(
                {$values}
            ) NOT NULL");

            return;
        }

        if ($driver === 'pgsql') {
            $values = collect($sourceTypes)
                ->map(fn (string $value): string => "'".str_replace("'", "''", $value)."'")
                ->implode(', ');

            DB::statement('ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_source_type_check');
            DB::statement(
                "ALTER TABLE point_transactions ADD CONSTRAINT point_transactions_source_type_check CHECK (source_type::text = ANY (ARRAY[{$values}]::text[]))"
            );
        }
    }
};
