<?php

namespace App\Services\Fan;

use App\Http\Controllers\DailyClaimController;
use App\Http\Controllers\PassportController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\TaskController;
use App\Http\Resources\LeaderboardEntryResource;
use App\Models\Club;
use App\Models\League;
use App\Models\Fandom;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use App\Models\Waitlist;
use App\Services\ReferralService;
use App\Services\SocialAccountService;
use App\Support\ApplicationSettings;
use Illuminate\Http\Request;

class FanPageDataService
{
    /**
     * Fallback club used when a fan cannot find their club in the list.
     * They can change it later once their club is added.
     */
    public const OTHER_CLUB = 'Other';

    /**
     * @return array<string, mixed>
     */
    public function campaign(?Request $request = null): array
    {
        $season = Season::query()->where('status', 'active')->latest('starts_at')->first();

        $topUsers = User::query()
            ->fanAccounts()
            ->with('loyaltyTier')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->limit(8)
            ->get()
            ->values()
            ->map(function (User $rankedUser, int $index): User {
                $rankedUser->setAttribute('rank', $index + 1);

                return $rankedUser;
            });

        $waitlistCount = Waitlist::count();
        $user = $request?->user();

        $viewer = null;

        if ($user) {
            $user->loadMissing('loyaltyTier');

            $rank = User::query()
                ->fanAccounts()
                ->where(function ($query) use ($user) {
                    $query->where('total_points', '>', $user->total_points)
                        ->orWhere(function ($query) use ($user) {
                            $query->where('total_points', $user->total_points)
                                ->where('id', '<', $user->id);
                        });
                })
                ->count() + 1;

            $tier = $user->loyaltyTier;
            $tierProgress = 12;

            if ($tier && $tier->max_points) {
                $range = max(1, $tier->max_points - $tier->min_points);
                $tierProgress = (int) min(100, max(5, round((($user->total_points - $tier->min_points) / $range) * 100)));
            }

            $viewer = [
                'fan_id' => $user->fan_id,
                'total_points' => $user->total_points,
                'referral_link' => url('/r/'.$user->fan_id),
                'rank' => $rank,
                'streak_days' => $user->current_streak_days,
                'multiplier' => number_format((float) ($user->current_streak_days >= 7 ? 1.5 : 1.0), 1),
                'tier_label' => strtoupper($tier?->name ?? 'STARTER TIER'),
                'tier_progress' => $tierProgress,
            ];
        }

        return [
            'waitlist_count' => $waitlistCount,
            'season' => $season ? [
                'code' => $season->code,
                'name' => $season->name,
                'total_weeks' => $season->total_weeks,
            ] : null,
            'leaderboard' => LeaderboardEntryResource::collection($topUsers)->resolve(),
            'viewer' => $viewer,
        ];
    }

    /**
     * Shared Inertia props for all fan-facing pages.
     *
     * @return array<string, mixed>
     */
    public function shared(Request $request): array
    {
        $season = Season::query()->where('status', 'active')->latest('starts_at')->first();

        return [
            'waitlist_email' => $request->session()->get('waitlist_email'),
            'referrer_fan_id' => app(ReferralService::class)->resolveReferrerFanId(),
            'onboarding_tasks' => $this->onboardingTasks($season),
            'social_handles' => $this->socialHandles(),
            'social_verification_required' => ApplicationSettings::socialVerificationRequired(),
            'show_guest_nav' => $request->is('login', 'register'),
        ];
    }

    /**
     * @return list<array{id: int, name: string, slug: string, is_active: bool}>
     */
    public function fandoms(): array
    {
        return Fandom::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'is_active'])
            ->map(fn (Fandom $fandom): array => [
                'id' => $fandom->id,
                'name' => $fandom->name,
                'slug' => $fandom->slug,
                'is_active' => $fandom->is_active,
            ])
            ->all();
    }

    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     short: string,
     *     logo_url: string|null,
     *     league: array{id: int, name: string, short: string}
     * }>
     */
    public function clubs(?int $fandomId = null): array
    {
        return Club::query()
            ->with('league:id,name,short')
            ->when($fandomId, fn ($query) => $query->whereHas(
                'league',
                fn ($leagueQuery) => $leagueQuery->where('fandom_id', $fandomId),
            ))
            ->orderBy(
                League::query()
                    ->select('name')
                    ->whereColumn('leagues.id', 'clubs.league_id'),
            )
            ->orderBy('name')
            ->get(['id', 'league_id', 'name', 'short', 'logo'])
            ->map(fn (Club $club): array => [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => [
                    'id' => $club->league->id,
                    'name' => $club->league->name,
                    'short' => $club->league->short,
                ],
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function onboardingTasks(?Season $season): array
    {
        return Task::query()
            ->when($season, fn ($query) => $query->where('season_id', $season->id))
            ->where('is_active', true)
            ->orderBy('display_order')
            ->limit(6)
            ->get(['name', 'description', 'points', 'platform', 'external_url'])
            ->map(fn (Task $task): array => [
                'name' => $task->name,
                'description' => $task->description,
                'points' => $task->points,
                'platform' => $task->platform,
                'external_url' => $task->external_url,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, string>>
     */
    public function socialHandles(): array
    {
        $settings = ApplicationSettings::values();
        $twitter = ltrim($settings['twitter_target_username'] ?? 'madfan', '@');
        $telegram = $settings['telegram_channel_username'] ?? '@madfan';
        $telegramHandle = str_starts_with($telegram, '@') ? $telegram : '@'.$telegram;

        return [
            [
                'platform' => 'x',
                'label' => 'X (Twitter)',
                'handle' => '@'.$twitter,
                'url' => 'https://x.com/'.$twitter,
            ],
            [
                'platform' => 'discord',
                'label' => 'Discord',
                'handle' => 'Join the server',
                'url' => $settings['discord_invite_url'] ?? 'https://discord.gg/madfan',
            ],
            [
                'platform' => 'telegram',
                'label' => 'Telegram',
                'handle' => $telegramHandle,
                'url' => 'https://t.me/'.ltrim($telegram, '@'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [
                'summary' => null,
                'by_source' => [],
                'recent_transactions' => [],
                'daily_series' => [],
            ];
        }

        return app(FanDashboardService::class)->forUser($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function dailyClaim(Request $request): array
    {
        return app(DailyClaimController::class)->show($request)->getData(true);
    }

    /**
     * @return array<string, mixed>
     */
    public function tasks(Request $request): array
    {
        $data = app(TaskController::class)->index($request)->getData(true);
        $season = Season::query()->where('status', 'active')->latest('starts_at')->first();
        $activeWeek = $season?->seasonWeeks()->where('is_active', true)->first();

        return [
            ...$data,
            'season' => $season ? ['code' => $season->code, 'name' => $season->name] : null,
            'active_week' => $activeWeek ? [
                'week_number' => $activeWeek->week_number,
                'name' => $activeWeek->name,
                'ends_at' => $activeWeek->ends_at?->toIso8601String(),
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function passport(Request $request): array
    {
        $passport = app(PassportController::class)->show($request)->getData(true);
        $referrals = app(ReferralController::class)->index($request)->getData(true);

        return [
            'passport' => $passport['passport'] ?? null,
            'referrals' => $referrals,
            'clubs' => $this->clubs(),
            'platform_x_handle' => '@'.ltrim(ApplicationSettings::twitterTargetUsername(), '@'),
            ...$this->connectedAccounts($request),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function connectedAccounts(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [
                'connected_accounts' => [],
                'required_accounts_complete' => false,
                'missing_required_accounts' => [],
                'social_links' => $this->socialHandles(),
                'telegram_bot_username' => config('services.telegram.bot_username'),
                'suggested_x_handle' => null,
            ];
        }

        $socialAccounts = app(SocialAccountService::class);

        return [
            'connected_accounts' => array_values($socialAccounts->statusForUser($user)),
            'required_accounts_complete' => $socialAccounts->hasRequiredConnections($user),
            'missing_required_accounts' => array_map(
                fn ($platform) => $platform->value,
                $socialAccounts->missingRequiredPlatforms($user),
            ),
            'social_links' => $this->socialHandles(),
            'telegram_bot_username' => config('services.telegram.bot_username'),
            'suggested_x_handle' => $user->handle,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function userHeader(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        return [
            'total_points' => $user->total_points,
            'current_streak_days' => $user->current_streak_days,
            'fan_id' => $user->fan_id,
            'name' => $user->name,
        ];
    }
}
