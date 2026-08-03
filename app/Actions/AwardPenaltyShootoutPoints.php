<?php

namespace App\Actions;

use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\User;
use App\Support\ApplicationSettings;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AwardPenaltyShootoutPoints
{
    /** Allowed zone awards after server-side scoring. */
    public const ALLOWED_AMOUNTS = [1, 3];

    /**
     * Scoring shots a fan can take before a cooldown starts.
     */
    public static function windowLimit(): int
    {
        return max(1, ApplicationSettings::shootoutWindowShots());
    }

    /**
     * Cooldown length after the window is filled.
     */
    public static function cooldownMinutes(): int
    {
        return max(1, ApplicationSettings::shootoutCooldownMinutes());
    }

    /**
     * Minimum seconds between credited awards.
     */
    public static function minSecondsBetween(): int
    {
        return max(0, ApplicationSettings::shootoutMinSecondsBetween());
    }

    /**
     * Derive award from zone grid. Client `points` is never trusted.
     *
     * @param  array{col: int, row: int}  $zone
     */
    public static function pointsForZone(array $zone): int
    {
        $col = (int) $zone['col'];
        $row = (int) $zone['row'];

        if ($col < 0 || $col > 2 || $row < 0 || $row > 2) {
            throw ValidationException::withMessages([
                'zone' => 'Invalid shootout zone.',
            ]);
        }

        if (! ApplicationSettings::shootoutCornerBonusEnabled()) {
            return 1;
        }

        $isCorner = ($col === 0 || $col === 2) && ($row === 0 || $row === 2);

        return $isCorner ? 3 : 1;
    }

    /**
     * Points credited from penalty shootouts since local midnight.
     *
     * @param  bool  $fresh  When true, bypass SWR and read the database (award/throttle responses).
     */
    public static function earnedTodayFor(User $user, bool $fresh = false): int
    {
        if ($fresh) {
            return self::queryEarnedToday($user);
        }

        $key = self::earnedTodayCacheKey($user);

        return (int) Cache::flexible($key, [15, 60], fn (): int => self::queryEarnedToday($user));
    }

    /**
     * Credited shootout wins (goals) since local midnight.
     */
    public static function winsTodayFor(User $user, bool $fresh = false): int
    {
        if ($fresh) {
            return self::queryWinsToday($user);
        }

        $key = self::winsTodayCacheKey($user);

        return (int) Cache::flexible($key, [15, 60], fn (): int => self::queryWinsToday($user));
    }

    /**
     * Recorded shootout losses (saves/misses) since local midnight.
     */
    public static function lossesTodayFor(User $user): int
    {
        self::ensureDayStats($user);

        return (int) $user->shootout_losses_today;
    }

    /**
     * Build shootout status for API/page payloads.
     *
     * @param  bool  $freshEarnings  Bypass SWR for earned_today / wins_today (use after mutations).
     * @return array{
     *   active: bool,
     *   window_earned: int,
     *   window_limit: int,
     *   cooldown_until: string|null,
     *   cooldown_seconds: int,
     *   cooldown_minutes: int,
     *   corner_bonus_enabled: bool,
     *   min_seconds_between: int,
     *   earned_today: int,
     *   wins_today: int,
     *   losses_today: int
     * }
     */
    public static function statusFor(User $user, bool $freshEarnings = false): array
    {
        $user->refresh();
        self::clearExpiredCooldown($user);
        self::ensureDayStats($user);

        $until = $user->shootout_cooldown_until;
        $seconds = $until && $until->isFuture()
            ? max(0, $until->getTimestamp() - now()->getTimestamp())
            : 0;

        $earnedToday = self::earnedTodayFor($user, $freshEarnings);
        $winsToday = self::winsTodayFor($user, $freshEarnings);

        if ($freshEarnings) {
            self::warmEarnedTodayCache($user, $earnedToday);
            self::warmWinsTodayCache($user, $winsToday);
        }

        return [
            'active' => $seconds <= 0,
            'window_earned' => (int) $user->shootout_window_earned,
            'window_limit' => self::windowLimit(),
            'cooldown_until' => $until?->toIso8601String(),
            'cooldown_seconds' => max(0, $seconds),
            'cooldown_minutes' => self::cooldownMinutes(),
            'corner_bonus_enabled' => ApplicationSettings::shootoutCornerBonusEnabled(),
            'min_seconds_between' => self::minSecondsBetween(),
            'earned_today' => $earnedToday,
            'wins_today' => $winsToday,
            'losses_today' => (int) $user->shootout_losses_today,
        ];
    }

    protected static function queryEarnedToday(User $user): int
    {
        return (int) PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('source_type', 'penalty_shootout')
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->startOfDay())
            ->sum('amount');
    }

    protected static function queryWinsToday(User $user): int
    {
        return (int) PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('source_type', 'penalty_shootout')
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->startOfDay())
            ->count();
    }

    /**
     * Drop the SWR cache so the next read (e.g. after an award) is authoritative.
     */
    public static function forgetEarnedTodayCache(User $user): void
    {
        $earnedKey = self::earnedTodayCacheKey($user);
        $winsKey = self::winsTodayCacheKey($user);

        Cache::forget($earnedKey);
        Cache::forget('illuminate:cache:flexible:created:'.$earnedKey);
        Cache::forget($winsKey);
        Cache::forget('illuminate:cache:flexible:created:'.$winsKey);
    }

    protected static function warmEarnedTodayCache(User $user, int $earnedToday): void
    {
        $key = self::earnedTodayCacheKey($user);

        Cache::putMany([
            $key => $earnedToday,
            'illuminate:cache:flexible:created:'.$key => now()->getTimestamp(),
        ], 60);
    }

    protected static function warmWinsTodayCache(User $user, int $winsToday): void
    {
        $key = self::winsTodayCacheKey($user);

        Cache::putMany([
            $key => $winsToday,
            'illuminate:cache:flexible:created:'.$key => now()->getTimestamp(),
        ], 60);
    }

    protected static function earnedTodayCacheKey(User $user): string
    {
        return 'shootout:earned_today:'.$user->id.':'.now()->toDateString();
    }

    protected static function winsTodayCacheKey(User $user): string
    {
        return 'shootout:wins_today:'.$user->id.':'.now()->toDateString();
    }

    /**
     * Reset daily loss counter when the calendar day rolls over.
     */
    protected static function ensureDayStats(User $user): void
    {
        $today = now()->toDateString();
        $statsDate = $user->shootout_stats_date;

        if ($statsDate !== null && $statsDate->toDateString() === $today) {
            return;
        }

        $user->forceFill([
            'shootout_stats_date' => $today,
            'shootout_losses_today' => 0,
        ])->save();
    }

    /**
     * Record a non-goal result toward today's loss total.
     *
     * @return array<string, mixed>
     */
    public function recordLoss(User $user): array
    {
        return DB::transaction(function () use ($user) {
            $locked = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            self::ensureDayStats($locked);
            $locked->increment('shootout_losses_today');

            return [
                'recorded' => true,
                'shootout' => self::statusFor($locked->fresh(), freshEarnings: true),
            ];
        });
    }

    /**
     * Credit a batch of locally buffered shootout awards (and optional losses).
     * Enforces the configured min-seconds spacing using each award's occurred_at.
     *
     * @param  list<array{idempotency_key: string, occurred_at: string, zone: array{col: int, row: int}}>  $awards
     * @param  list<array{idempotency_key: string, occurred_at: string, result?: string}>  $losses
     * @return array<string, mixed>
     */
    public function handleBulk(User $user, array $awards, array $losses = []): array
    {
        usort($awards, static function (array $left, array $right): int {
            return strcmp((string) $left['occurred_at'], (string) $right['occurred_at']);
        });

        return DB::transaction(function () use ($user, $awards, $losses) {
            $locked = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            self::ensureDayStats($locked);
            self::clearExpiredCooldown($locked);

            $awardResults = [];
            $pointsAwarded = 0;
            $minSeconds = self::minSecondsBetween();
            $lastAwardedAt = $locked->shootout_last_awarded_at;
            $season = Season::query()->where('status', 'active')->latest('starts_at')->first();
            $windowLimit = self::windowLimit();
            $didMutate = false;

            foreach ($awards as $award) {
                $key = (string) $award['idempotency_key'];
                $zone = $award['zone'];
                $occurredAt = self::normalizeOccurredAt($award['occurred_at'] ?? null);

                $existing = PointTransaction::query()
                    ->where('idempotency_key', $key)
                    ->first();

                if ($existing !== null) {
                    $awardResults[] = [
                        'idempotency_key' => $key,
                        'status' => 'duplicate',
                        'points_awarded' => 0,
                    ];

                    continue;
                }

                if ($occurredAt === null) {
                    $awardResults[] = [
                        'idempotency_key' => $key,
                        'status' => 'invalid',
                        'points_awarded' => 0,
                    ];

                    continue;
                }

                if ($locked->shootout_cooldown_until !== null && $locked->shootout_cooldown_until->isFuture()) {
                    $awardResults[] = [
                        'idempotency_key' => $key,
                        'status' => 'cooldown',
                        'points_awarded' => 0,
                    ];

                    continue;
                }

                if (
                    $minSeconds > 0
                    && $lastAwardedAt !== null
                    && $occurredAt->lessThanOrEqualTo($lastAwardedAt->copy()->addSeconds($minSeconds))
                ) {
                    $awardResults[] = [
                        'idempotency_key' => $key,
                        'status' => 'throttled',
                        'points_awarded' => 0,
                    ];

                    continue;
                }

                $shotsTaken = (int) $locked->shootout_window_earned;

                if ($shotsTaken >= $windowLimit) {
                    if ($locked->shootout_cooldown_until === null || ! $locked->shootout_cooldown_until->isFuture()) {
                        $locked->forceFill([
                            'shootout_cooldown_until' => now()->addMinutes(self::cooldownMinutes()),
                        ])->save();
                        $didMutate = true;
                    }

                    $awardResults[] = [
                        'idempotency_key' => $key,
                        'status' => 'cooldown',
                        'points_awarded' => 0,
                    ];

                    continue;
                }

                $points = self::pointsForZone($zone);
                $newBalance = (int) $locked->total_points + $points;
                $newShots = $shotsTaken + 1;
                $startsCooldown = $newShots >= $windowLimit;
                $isCorner = ($zone['col'] === 0 || $zone['col'] === 2)
                    && ($zone['row'] === 0 || $zone['row'] === 2);

                try {
                    PointTransaction::query()->create([
                        'user_id' => $locked->id,
                        'season_id' => $season?->id,
                        'source_type' => 'penalty_shootout',
                        'source_id' => null,
                        'amount' => $points,
                        'balance_after' => $newBalance,
                        'reason' => $points >= 3
                            ? 'Penalty shootout corner win'
                            : 'Penalty shootout win',
                        'metadata' => [
                            'zone' => [
                                'col' => (int) $zone['col'],
                                'row' => (int) $zone['row'],
                                'is_corner' => $isCorner,
                            ],
                            'game' => 'penalty_shootout',
                            'window_earned' => $newShots,
                            'window_limit' => $windowLimit,
                            'server_scored' => true,
                            'occurred_at' => $occurredAt->toIso8601String(),
                            'bulk' => true,
                        ],
                        'idempotency_key' => $key,
                    ]);
                } catch (QueryException $exception) {
                    if (! self::isUniqueIdempotencyViolation($exception)) {
                        throw $exception;
                    }

                    $awardResults[] = [
                        'idempotency_key' => $key,
                        'status' => 'duplicate',
                        'points_awarded' => 0,
                    ];

                    continue;
                }

                $locked->forceFill([
                    'total_points' => $newBalance,
                    'shootout_window_earned' => $newShots,
                    'shootout_last_awarded_at' => $occurredAt,
                    'shootout_cooldown_until' => $startsCooldown
                        ? now()->addMinutes(self::cooldownMinutes())
                        : null,
                ])->save();

                $lastAwardedAt = $occurredAt;
                $pointsAwarded += $points;
                $didMutate = true;

                $awardResults[] = [
                    'idempotency_key' => $key,
                    'status' => 'accepted',
                    'points_awarded' => $points,
                ];
            }

            $lossResults = [];

            foreach ($losses as $loss) {
                $key = (string) $loss['idempotency_key'];
                $cacheKey = 'shootout:loss_idem:'.$locked->id.':'.$key;

                if (! Cache::add($cacheKey, 1, now()->addDays(7))) {
                    $lossResults[] = [
                        'idempotency_key' => $key,
                        'status' => 'duplicate',
                    ];

                    continue;
                }

                self::ensureDayStats($locked);
                $locked->increment('shootout_losses_today');
                $didMutate = true;

                $lossResults[] = [
                    'idempotency_key' => $key,
                    'status' => 'accepted',
                ];
            }

            if ($didMutate) {
                self::forgetEarnedTodayCache($locked);
            }

            $fresh = $locked->fresh();

            return [
                'points_awarded' => $pointsAwarded,
                'new_total_points' => (int) $fresh->total_points,
                'results' => $awardResults,
                'loss_results' => $lossResults,
                'shootout' => self::statusFor($fresh, freshEarnings: true),
            ];
        });
    }

    /**
     * Clamp client timestamps so bulk catch-up cannot invent future/ancient awards.
     */
    protected static function normalizeOccurredAt(mixed $value): ?CarbonInterface
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            $occurredAt = Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }

        $now = now();

        if ($occurredAt->greaterThan($now->copy()->addSeconds(30))) {
            $occurredAt = $now;
        }

        if ($occurredAt->lessThan($now->copy()->subDays(7))) {
            return null;
        }

        return $occurredAt;
    }

    /**
     * Credit shootout zone points to the fan balance.
     * Each credited win counts as one shot toward the cooldown window.
     *
     * @param  array{col: int, row: int, is_corner?: bool}  $zone
     * @return array<string, mixed>
     */
    public function handle(User $user, string $idempotencyKey, array $zone): array
    {
        $bulk = $this->handleBulk($user, [[
            'idempotency_key' => $idempotencyKey,
            'occurred_at' => now()->toIso8601String(),
            'zone' => $zone,
        ]]);

        $first = $bulk['results'][0] ?? null;
        $status = is_array($first) ? (string) ($first['status'] ?? '') : '';

        return [
            'points_awarded' => (int) ($bulk['points_awarded'] ?? 0),
            'new_total_points' => (int) ($bulk['new_total_points'] ?? 0),
            'duplicate' => $status === 'duplicate',
            'cooldown' => $status === 'cooldown' || ! (bool) ($bulk['shootout']['active'] ?? true),
            'throttled' => $status === 'throttled',
            'shootout' => $bulk['shootout'],
        ];
    }

    protected static function clearExpiredCooldown(User $user): void
    {
        if ($user->shootout_cooldown_until === null) {
            return;
        }

        if ($user->shootout_cooldown_until->isFuture()) {
            return;
        }

        $user->forceFill([
            'shootout_cooldown_until' => null,
            'shootout_window_earned' => 0,
        ])->save();
    }

    protected static function isUniqueIdempotencyViolation(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'idempotency_key')
            || str_contains($message, 'unique')
            || (string) $exception->getCode() === '23000';
    }
}
