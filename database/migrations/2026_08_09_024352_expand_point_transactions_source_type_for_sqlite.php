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
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite stores enum as a CHECK constraint; MODIFY ENUM is MySQL-only.
            Schema::table('point_transactions', function (Blueprint $table): void {
                $table->enum('source_type', self::SOURCE_TYPES)->change();
            });

            return;
        }

        if ($driver === 'mysql') {
            $this->modifyMysqlEnum(self::SOURCE_TYPES);
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('point_transactions', function (Blueprint $table): void {
                $table->enum('source_type', self::SOURCE_TYPES_WITHOUT_SOCIAL)->change();
            });

            return;
        }

        if ($driver === 'mysql') {
            $this->modifyMysqlEnum(self::SOURCE_TYPES_WITHOUT_SOCIAL);
        }
    }

    /**
     * @param  list<string>  $sourceTypes
     */
    private function modifyMysqlEnum(array $sourceTypes): void
    {
        $values = collect($sourceTypes)
            ->map(fn (string $value): string => "'{$value}'")
            ->implode(",\n            ");

        DB::statement("ALTER TABLE point_transactions MODIFY source_type ENUM(
            {$values}
        ) NOT NULL");
    }
};
