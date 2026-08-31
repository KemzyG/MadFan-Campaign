<?php

namespace App\Services\Social;

use App\Enums\MatchStatus;
use App\Enums\PointSourceType;
use App\Models\Club;
use App\Models\Fandom;
use App\Models\MatchFixture;
use App\Models\PointTransaction;
use App\Models\Prediction;
use App\Models\Season;
use App\Models\User;
use App\Models\UserPrediction;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Predictions are auto-created from upcoming fixtures (there's nothing to
 * author — the outcome space is fixed Home/Draw/Away and the closing time is
 * the fixture's own kickoff), and auto-resolved the moment a fixture is
 * saved as Finished with both scores set (see MatchFixtureObserver).
 */
class PredictionService
{
    public function __construct(private SocialPassportService $socialPassport) {}

    /**
     * Backfill a Prediction for every upcoming fixture that doesn't have one
     * yet. Idempotent — safe to call on every hub page load.
     */
    public function ensureForUpcomingFixtures(?Fandom $fandom = null): void
    {
        $season = Season::query()->where('status', 'active')->latest('starts_at')->first();

        MatchFixture::query()
            ->where('status', MatchStatus::Upcoming)
            ->where('kickoff_at', '>', now())
            ->doesntHave('prediction')
            ->get()
            ->each(function (MatchFixture $fixture) use ($fandom, $season): void {
                try {
                    Prediction::query()->create([
                        'match_fixture_id' => $fixture->id,
                        'fandom_id' => $fandom?->id,
                        'season_id' => $season?->id,
                        'closes_at' => $fixture->kickoff_at,
                    ]);
                } catch (QueryException) {
                    // Unique constraint race — another request already created it.
                }
            });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function openForFandom(?Fandom $fandom, ?User $viewer, int $limit = 6): Collection
    {
        return Prediction::query()
            ->whereNull('resolved_at')
            ->where('closes_at', '>', now())
            ->when($fandom, fn ($q) => $q->where('fandom_id', $fandom->id))
            ->with(['matchFixture.homeClub:id,name,short,logo', 'matchFixture.awayClub:id,name,short,logo'])
            ->orderBy('closes_at')
            ->limit($limit)
            ->get()
            ->map(fn (Prediction $prediction) => $this->present($prediction, $viewer));
    }

    /**
     * @return array<string, mixed>
     */
    public function present(Prediction $prediction, ?User $viewer): array
    {
        $fixture = $prediction->matchFixture;
        $mine = $viewer
            ? UserPrediction::query()
                ->where('prediction_id', $prediction->id)
                ->where('user_id', $viewer->id)
                ->first()
            : null;

        return [
            'id' => $prediction->id,
            'points_reward' => $prediction->points_reward,
            'closes_at' => $prediction->closes_at->toIso8601String(),
            'is_open' => $prediction->isOpen(),
            'resolved' => $prediction->isResolved(),
            'correct_choice' => $prediction->correct_choice,
            'fixture' => $fixture ? [
                'id' => $fixture->id,
                'home' => $this->presentClub($fixture->homeClub),
                'away' => $this->presentClub($fixture->awayClub),
                'kickoff_at' => $fixture->kickoff_at?->toIso8601String(),
                'home_score' => $fixture->home_score,
                'away_score' => $fixture->away_score,
            ] : null,
            'my_choice' => $mine?->choice,
            'my_result' => $mine ? [
                'is_correct' => $mine->is_correct,
                'points_awarded' => $mine->points_awarded,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function presentClub(?Club $club): ?array
    {
        if ($club === null) {
            return null;
        }

        return [
            'id' => $club->id,
            'name' => $club->name,
            'short' => $club->short,
            'logo_url' => $club->logo_url,
        ];
    }

    /**
     * @throws ValidationException
     */
    public function vote(User $user, Prediction $prediction, string $choice): void
    {
        if (! in_array($choice, [Prediction::CHOICE_HOME, Prediction::CHOICE_DRAW, Prediction::CHOICE_AWAY], true)) {
            throw ValidationException::withMessages(['choice' => 'Invalid prediction choice.']);
        }

        if (! $prediction->isOpen()) {
            throw ValidationException::withMessages(['choice' => 'Predictions are closed for this fixture.']);
        }

        UserPrediction::query()->updateOrCreate(
            ['prediction_id' => $prediction->id, 'user_id' => $user->id],
            ['choice' => $choice],
        );
    }

    /**
     * Resolve a prediction, marking every submitted guess correct/incorrect
     * and awarding points for the correct ones. Safe to call more than once —
     * a resolved prediction is skipped.
     *
     * Normally the outcome is derived from the fixture's final score, and
     * only once it's actually Finished (the auto-resolve path — see
     * EditMatchFixture::afterSave and Admin\FixturesController::update()).
     * $forceChoice lets an admin settle a prediction by hand instead (e.g.
     * the fixture record itself is wrong or missing) — see
     * Admin\PredictionsController::update(), the only caller that passes it.
     * That path skips the "fixture must be Finished" guard on purpose: an
     * admin choosing to force a choice already knows the outcome.
     */
    public function resolve(Prediction $prediction, ?string $forceChoice = null): void
    {
        if ($prediction->isResolved()) {
            return;
        }

        if ($forceChoice !== null) {
            $correctChoice = $forceChoice;
        } else {
            $fixture = $prediction->matchFixture;

            if ($fixture === null || ! $fixture->isFinished()) {
                return;
            }

            $correctChoice = match (true) {
                $fixture->home_score > $fixture->away_score => Prediction::CHOICE_HOME,
                $fixture->home_score < $fixture->away_score => Prediction::CHOICE_AWAY,
                default => Prediction::CHOICE_DRAW,
            };
        }

        DB::transaction(function () use ($prediction, $correctChoice): void {
            $prediction->update(['correct_choice' => $correctChoice, 'resolved_at' => now()]);

            $prediction->userPredictions()->with('user')->get()->each(function (UserPrediction $guess) use ($prediction, $correctChoice): void {
                $isCorrect = $guess->choice === $correctChoice;
                $guess->is_correct = $isCorrect;

                if ($isCorrect && $guess->user !== null) {
                    $transaction = $this->awardPrediction($guess->user, $prediction);
                    $guess->points_awarded = $transaction?->amount ?? 0;
                    $guess->point_transaction_id = $transaction?->id;
                }

                $guess->save();
            });
        });
    }

    private function awardPrediction(User $user, Prediction $prediction): ?PointTransaction
    {
        $sourceType = PointSourceType::SocialPrediction->value;
        $idempotencyKey = "{$sourceType}-{$user->id}-{$prediction->id}";

        if (PointTransaction::query()->where('idempotency_key', $idempotencyKey)->exists()) {
            return null;
        }

        $season = Season::query()->where('status', 'active')->latest('starts_at')->first();
        $user->refresh();
        $points = $prediction->points_reward;
        $newBalance = (int) $user->total_points + $points;

        $transaction = PointTransaction::query()->create([
            'user_id' => $user->id,
            'season_id' => $season?->id,
            'source_type' => $sourceType,
            'source_id' => (string) $prediction->id,
            'amount' => $points,
            'balance_after' => $newBalance,
            'reason' => 'Correct match prediction',
            'idempotency_key' => $idempotencyKey,
        ]);

        $user->increment('total_points', $points);
        $user->refresh();
        $this->socialPassport->syncSnapshot($user);

        return $transaction;
    }
}
