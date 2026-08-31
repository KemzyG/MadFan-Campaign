<?php

namespace App\Actions\Social;

use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\User;
use App\Services\Social\SocialPassportService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AwardSocialPoints
{
    public const SOURCE_POST = 'social_post';

    public const SOURCE_REPLY = 'social_reply';

    public const SOURCE_LIKE_RECEIVED = 'social_like_received';

    public const SOURCE_CHAT = 'social_chat';

    public const SOURCE_POLL_VOTE = 'social_poll';

    public const SOURCE_SHOWDOWN_VOTE = 'social_showdown';

    /** @var array<string, array{points: int, cap: int, min_chars?: int}> */
    public const RULES = [
        self::SOURCE_POST => ['points' => 5, 'cap' => 3],
        self::SOURCE_REPLY => ['points' => 2, 'cap' => 10, 'min_chars' => 20],
        self::SOURCE_LIKE_RECEIVED => ['points' => 1, 'cap' => 50],
        self::SOURCE_CHAT => ['points' => 1, 'cap' => 25, 'min_chars' => 5],
        self::SOURCE_POLL_VOTE => ['points' => 3, 'cap' => 5],
        // Voting itself stays unlimited (see ShowdownService::vote — tap_count
        // keeps climbing forever); only the points a tap can earn are capped,
        // and capped per day rather than per showdown so the reward can't be
        // farmed by spamming taps on one showdown or hopping between many.
        self::SOURCE_SHOWDOWN_VOTE => ['points' => 1, 'cap' => 10],
    ];

    public function __construct(
        private SocialPassportService $socialPassport,
    ) {}

    public function forPost(User $author, int $postId): ?PointTransaction
    {
        return $this->award($author, self::SOURCE_POST, (string) $postId, 'Social post published');
    }

    public function forReply(User $author, int $postId, string $body): ?PointTransaction
    {
        $minChars = self::RULES[self::SOURCE_REPLY]['min_chars'] ?? 0;

        if (mb_strlen(trim($body)) < $minChars) {
            return null;
        }

        return $this->award($author, self::SOURCE_REPLY, (string) $postId, 'Social reply published');
    }

    public function forLikeReceived(User $author, int $postId, int $likerId): ?PointTransaction
    {
        if ($author->id === $likerId) {
            return null;
        }

        return $this->award(
            $author,
            self::SOURCE_LIKE_RECEIVED,
            $postId.'-'.$likerId,
            'Like received on social post',
        );
    }

    public function forChat(User $author, int $messageId, string $body): ?PointTransaction
    {
        $minChars = self::RULES[self::SOURCE_CHAT]['min_chars'] ?? 0;

        if (mb_strlen(trim($body)) < $minChars) {
            return null;
        }

        return $this->award($author, self::SOURCE_CHAT, (string) $messageId, 'Club chat message');
    }

    public function forPollVote(User $user, int $pollId): ?PointTransaction
    {
        return $this->award($user, self::SOURCE_POLL_VOTE, (string) $pollId, 'Poll vote cast');
    }

    /**
     * $tapNumber (this user's running tap_count on this showdown) is the
     * per-call idempotency source id — a distinct id per tap is what lets
     * award()'s daily cap count "how many taps have earned points today"
     * instead of collapsing every tap on one showdown into a single award.
     */
    public function forShowdownVote(User $user, int $showdownId, int $tapNumber): ?PointTransaction
    {
        return $this->award($user, self::SOURCE_SHOWDOWN_VOTE, "{$showdownId}-{$tapNumber}", 'Showdown vote cast');
    }

    public function award(User $user, string $sourceType, string $sourceId, string $reason): ?PointTransaction
    {
        $rule = self::RULES[$sourceType] ?? null;

        if ($rule === null) {
            return null;
        }

        $points = $rule['points'];
        $cap = $rule['cap'];
        $idempotencyKey = "{$sourceType}-{$user->id}-{$sourceId}";

        try {
            return DB::transaction(function () use ($user, $sourceType, $sourceId, $reason, $points, $cap, $idempotencyKey): ?PointTransaction {
                if (PointTransaction::query()->where('idempotency_key', $idempotencyKey)->exists()) {
                    return null;
                }

                $awardedToday = (int) PointTransaction::query()
                    ->where('user_id', $user->id)
                    ->where('source_type', $sourceType)
                    ->whereDate('created_at', today())
                    ->count();

                if ($awardedToday >= $cap) {
                    return null;
                }

                $season = Season::query()->where('status', 'active')->latest('starts_at')->first();
                $user->refresh();
                $newBalance = (int) $user->total_points + $points;

                $transaction = PointTransaction::query()->create([
                    'user_id' => $user->id,
                    'season_id' => $season?->id,
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                    'amount' => $points,
                    'balance_after' => $newBalance,
                    'reason' => $reason,
                    'idempotency_key' => $idempotencyKey,
                ]);

                $user->increment('total_points', $points);
                $user->refresh();
                $this->socialPassport->syncSnapshot($user);

                return $transaction;
            });
        } catch (QueryException $exception) {
            Log::warning('Social points award failed; primary social action continues.', [
                'user_id' => $user->id,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'idempotency_key' => $idempotencyKey,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
