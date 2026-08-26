<?php

namespace App\Support\Social;

use Illuminate\Support\Carbon;

/**
 * Defines the daily engagement tasks and how their targets and reward scale
 * week over week. Difficulty is anchored to a fixed calendar epoch — not
 * per-user tenure — so every fan is on the same challenge on the same
 * real-world week, and it's capped at MAX_TIER so it never runs away.
 */
class DailyTaskCatalog
{
    public const EPOCH = '2026-08-24';

    public const MAX_TIER = 7;

    private const REWARD_BASE = 40;

    private const REWARD_PER_TIER = 5;

    private const REWARD_CAP = 100;

    /**
     * Base target, and how it grows: +1 every `every` tiers, up to `cap`.
     *
     * @var array<string, array{label: string, description: string, unit: string, base: int, every: int, cap: int}>
     */
    private const DEFS = [
        'post' => [
            'label' => 'Post to the terrace',
            'description' => 'Publish :target original post(s) today.',
            'unit' => 'post',
            'base' => 1,
            'every' => 3,
            'cap' => 3,
        ],
        'like' => [
            'label' => 'Show some love',
            'description' => 'Like :target post(s) today.',
            'unit' => 'like',
            'base' => 3,
            'every' => 2,
            'cap' => 8,
        ],
        'video' => [
            'label' => 'Go live on Shorts',
            'description' => 'Publish :target short video(s) today.',
            'unit' => 'video',
            'base' => 1,
            'every' => 4,
            'cap' => 2,
        ],
        'comment' => [
            'label' => 'Join the conversation',
            'description' => 'Comment on :target different post(s) today.',
            'unit' => 'comment',
            'base' => 4,
            'every' => 2,
            'cap' => 9,
        ],
        'stage' => [
            'label' => 'Hop on Stage',
            'description' => 'Spend :target minute(s) in a live Stage today.',
            'unit' => 'minute',
            'base' => 2,
            'every' => 2,
            'cap' => 8,
        ],
    ];

    /**
     * Weeks since EPOCH, clamped to [0, MAX_TIER]. `$date` before EPOCH
     * (shouldn't happen once shipped) reads as week 0 rather than negative.
     */
    public static function tierFor(Carbon $date): int
    {
        $epoch = Carbon::parse(self::EPOCH)->startOfDay();
        $day = $date->copy()->startOfDay();

        if ($day->lt($epoch)) {
            return 0;
        }

        $weeks = intdiv((int) $epoch->diffInDays($day), 7);

        return min(self::MAX_TIER, $weeks);
    }

    public static function weekLabel(int $tier): string
    {
        return 'Week '.($tier + 1);
    }

    /**
     * @return list<array{key: string, label: string, description: string, unit: string, target: int}>
     */
    public static function tasksFor(Carbon $date): array
    {
        $tier = self::tierFor($date);

        $tasks = [];

        foreach (self::DEFS as $key => $def) {
            $target = min($def['cap'], $def['base'] + intdiv($tier, $def['every']));

            $tasks[] = [
                'key' => $key,
                'label' => $def['label'],
                'description' => str_replace(':target', (string) $target, $def['description']),
                'unit' => $def['unit'],
                'target' => $target,
            ];
        }

        return $tasks;
    }

    public static function rewardFor(Carbon $date): int
    {
        $tier = self::tierFor($date);

        return min(self::REWARD_CAP, self::REWARD_BASE + $tier * self::REWARD_PER_TIER);
    }
}
