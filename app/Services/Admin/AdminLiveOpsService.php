<?php

namespace App\Services\Admin;

use App\Enums\LiveStageStatus;
use App\Enums\MatchStatus;
use App\Enums\StageStatus;
use App\Models\LiveStage;
use App\Models\MatchFixture;
use App\Models\Stage;
use App\Services\Analytics\AnalyticsService;

class AdminLiveOpsService
{
    public function __construct(
        private AnalyticsService $analytics,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pageData(): array
    {
        $socialStages = Stage::query()
            ->with(['host:id,name,username,fan_id', 'club:id,name,short'])
            ->where('status', StageStatus::Live)
            ->latest('started_at')
            ->limit(20)
            ->get()
            ->map(fn (Stage $stage): array => [
                'id' => $stage->id,
                'title' => $stage->title,
                'type' => 'social_stage',
                'host' => $stage->host?->name,
                'club' => $stage->club?->name,
                'started_at' => $stage->started_at?->toIso8601String(),
                'voice_enabled' => $stage->voice_enabled,
            ])
            ->values()
            ->all();

        $liveStages = LiveStage::query()
            ->with(['host:id,name,username,fan_id', 'club:id,name,short'])
            ->where('status', LiveStageStatus::Live)
            ->latest('started_at')
            ->limit(20)
            ->get()
            ->map(fn (LiveStage $stage): array => [
                'id' => $stage->id,
                'title' => $stage->title,
                'type' => 'live_stage',
                'host' => $stage->host?->name,
                'club' => $stage->club?->name,
                'started_at' => $stage->started_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $liveFixtures = MatchFixture::query()
            ->with(['homeClub:id,name,short', 'awayClub:id,name,short'])
            ->where('status', MatchStatus::Live)
            ->orderBy('kickoff_at')
            ->limit(20)
            ->get()
            ->map(fn (MatchFixture $fixture): array => [
                'id' => $fixture->id,
                'title' => ($fixture->homeClub?->name ?? 'Home').' vs '.($fixture->awayClub?->name ?? 'Away'),
                'competition' => $fixture->competition,
                'score' => "{$fixture->home_score}-{$fixture->away_score}",
                'kickoff_at' => $fixture->kickoff_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            'stats' => [
                'active_events_now' => $this->analytics->activeEventsNow(),
                'daily_active_live_today' => $this->analytics->dailyActiveLiveToday(),
                'daily_live_participants_today' => $this->analytics->dailyLiveParticipantsToday(),
                'live_social_stages' => count($socialStages),
                'live_broadcast_stages' => count($liveStages),
                'live_fixtures' => count($liveFixtures),
            ],
            'active_events' => $this->analytics->activeEventsList(25),
            'social_stages' => $socialStages,
            'live_stages' => $liveStages,
            'live_fixtures' => $liveFixtures,
        ];
    }
}
