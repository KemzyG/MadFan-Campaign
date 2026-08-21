<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Full set of allowed point_transactions.source_type values.
     *
     * Production Postgres still had the original CHECK constraint from the
     * create migration; MySQL/SQLite were expanded earlier, but those
     * migrations no-op on pgsql.
     *
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
    ];

    /**
     * @var list<string>
     */
    private const SOURCE_TYPES_WITHOUT_SOCIAL = [
        'task',
        'daily_claim',
        'referral',
        'bonus',
        'club_pick',
        'admin_adjustment',
        'penalty_shootout',
    ];

    public function up(): void
    {
        $this->replaceCheckConstraint(self::SOURCE_TYPES);
    }

    public function down(): void
    {
        $this->replaceCheckConstraint(self::SOURCE_TYPES_WITHOUT_SOCIAL);
    }

    /**
     * @param  list<string>  $sourceTypes
     */
    private function replaceCheckConstraint(array $sourceTypes): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        $values = collect($sourceTypes)
            ->map(fn (string $value): string => "'".str_replace("'", "''", $value)."'")
            ->implode(', ');

        DB::statement('ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_source_type_check');
        DB::statement(
            "ALTER TABLE point_transactions ADD CONSTRAINT point_transactions_source_type_check CHECK (source_type::text = ANY (ARRAY[{$values}]::text[]))"
        );
    }
};
