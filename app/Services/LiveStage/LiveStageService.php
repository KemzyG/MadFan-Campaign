<?php

namespace App\Services\LiveStage;

use App\Contracts\LiveStage\MediaProvider;
use App\Enums\LiveStageModerationAction;
use App\Enums\LiveStageStatus;
use App\Enums\LiveStageType;
use App\Events\LiveStage\LiveStageCommentCreated;
use App\Events\LiveStage\LiveStageCommentDeleted;
use App\Events\LiveStage\LiveStageEnded;
use App\Events\LiveStage\LiveStageReactionCreated;
use App\Events\LiveStage\LiveStageStarted;
use App\Events\LiveStage\LiveStageUpdated;
use App\Events\LiveStage\LiveStageViewerCountUpdated;
use App\Events\LiveStage\LiveStageViewerModerated;
use App\Models\LiveStage;
use App\Models\LiveStageComment;
use App\Models\LiveStageModerationLog;
use App\Models\LiveStageReactionTotal;
use App\Models\LiveStageViewerSession;
use App\Models\User;
use App\Support\LiveStage\LiveStageTypeConfig;
use App\Support\SocialBroadcast;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LiveStageService
{
    public const MAX_TITLE_LENGTH = 100;

    public const MAX_DESCRIPTION_LENGTH = 500;

    public const MAX_COMMENT_LENGTH = 280;

    public const COMMENTS_PAGE_SIZE = 60;

    /**
     * Presence window — mirrors StageService::PRESENCE_TIMEOUT_SECONDS. A
     * viewer session not refreshed within this many seconds is considered
     * gone and swept on the next read.
     */
    public const PRESENCE_TIMEOUT_SECONDS = 90;

    /**
     * @var list<string>
     */
    public const REACTIONS = ['❤️', '🔥', '👏', '😂', '😮'];

    public function __construct(private readonly MediaProvider $media) {}

    /**
     * @param  array{title: string, type: string, description?: string|null, is_public?: bool}  $data
     */
    public function create(User $host, array $data): LiveStage
    {
        $type = LiveStageType::tryFrom((string) $data['type']);

        if ($type === null || ! LiveStageTypeConfig::isImplemented($type)) {
            throw ValidationException::withMessages([
                'type' => 'That stage format is not available yet.',
            ]);
        }

        $config = LiveStageTypeConfig::for($type);

        return LiveStage::query()->create([
            'host_id' => $host->id,
            'club_id' => $host->favourite_club_id,
            'type' => $type,
            'title' => trim((string) $data['title']),
            'description' => filled($data['description'] ?? null) ? trim((string) $data['description']) : null,
            'is_public' => (bool) ($data['is_public'] ?? true),
            'status' => LiveStageStatus::Draft,
            'stream_provider' => 'livekit',
            'settings' => [
                'allow_comments' => (bool) ($data['allow_comments'] ?? $config['default_allow_comments']),
                'allow_reactions' => (bool) ($data['allow_reactions'] ?? $config['default_allow_reactions']),
            ],
        ]);
    }

    /**
     * Host confirms devices are ready in the pre-live studio and goes live.
     * The room is allocated here (not at create()) so a draft stage the host
     * abandons never touches the media plane at all.
     */
    public function start(LiveStage $stage, User $host): LiveStage
    {
        $this->assertHost($stage, $host);

        if ($stage->status->isTerminal()) {
            throw ValidationException::withMessages([
                'stage' => 'This stage has already ended.',
            ]);
        }

        if ($stage->status === LiveStageStatus::Live) {
            return $stage;
        }

        return DB::transaction(function () use ($stage, $host): LiveStage {
            $roomId = $this->media->createRoom($stage);

            $stage->update([
                'status' => LiveStageStatus::Live,
                'stream_room_id' => $roomId,
                'started_at' => now(),
            ]);

            $stage = $stage->fresh();
            SocialBroadcast::try(fn () => LiveStageStarted::dispatch($stage));

            return $stage;
        });
    }

    public function end(LiveStage $stage, User $actor): LiveStage
    {
        $this->assertHost($stage, $actor);

        if ($stage->status->isTerminal()) {
            return $stage;
        }

        DB::transaction(function () use ($stage): void {
            $stage->update([
                'status' => LiveStageStatus::Ended,
                'ended_at' => now(),
            ]);

            LiveStageViewerSession::query()
                ->where('live_stage_id', $stage->id)
                ->whereNull('left_at')
                ->update(['left_at' => now()]);
        });

        $this->media->endRoom($stage);

        $stage = $stage->fresh();
        SocialBroadcast::try(fn () => LiveStageEnded::dispatch($stage));

        return $stage;
    }

    public function join(LiveStage $stage, User $viewer): LiveStageViewerSession
    {
        if (! $stage->isLive()) {
            throw ValidationException::withMessages([
                'stage' => 'This stage is not live.',
            ]);
        }

        $session = LiveStageViewerSession::query()->firstOrNew([
            'live_stage_id' => $stage->id,
            'user_id' => $viewer->id,
        ]);

        if ($session->exists && $session->banned_at !== null) {
            throw ValidationException::withMessages([
                'stage' => 'You were removed from this stage.',
            ]);
        }

        $wasActive = $session->exists && $session->left_at === null;

        $session->fill([
            'joined_at' => $session->exists ? $session->joined_at : now(),
            'last_seen_at' => now(),
            'left_at' => null,
        ]);
        $session->save();

        if (! $wasActive) {
            $this->broadcastViewerCount($stage);
        }

        return $session;
    }

    public function leave(LiveStage $stage, User $viewer): void
    {
        $session = $this->activeSession($stage, $viewer);

        if ($session === null) {
            return;
        }

        if ($stage->isHost($viewer) && $stage->isLive()) {
            $this->end($stage, $viewer);

            return;
        }

        $session->left_at = now();
        $session->save();

        $this->broadcastViewerCount($stage);
    }

    public function heartbeat(LiveStage $stage, User $viewer): void
    {
        LiveStageViewerSession::query()
            ->where('live_stage_id', $stage->id)
            ->where('user_id', $viewer->id)
            ->whereNull('left_at')
            ->update(['last_seen_at' => now()]);
    }

    /**
     * Lazy-on-read stale sweep — same shape as StageService::pruneStaleParticipants.
     * No scheduled run loop in this app, so every room-state read pays this
     * cheap check instead.
     */
    public function pruneStaleViewers(LiveStage $stage): bool
    {
        if (! $stage->isLive()) {
            return false;
        }

        $cutoff = now()->subSeconds(self::PRESENCE_TIMEOUT_SECONDS);

        $staleIds = LiveStageViewerSession::query()
            ->where('live_stage_id', $stage->id)
            ->whereNull('left_at')
            ->whereNotNull('last_seen_at')
            ->where('last_seen_at', '<', $cutoff)
            ->pluck('id');

        if ($staleIds->isEmpty()) {
            return false;
        }

        LiveStageViewerSession::query()->whereIn('id', $staleIds)->update(['left_at' => now()]);

        $this->broadcastViewerCount($stage);

        return true;
    }

    public function postComment(LiveStage $stage, User $user, string $body): LiveStageComment
    {
        if (! $stage->isLive()) {
            throw ValidationException::withMessages([
                'stage' => 'This stage is not live.',
            ]);
        }

        if (! (bool) ($stage->settings['allow_comments'] ?? true)) {
            throw ValidationException::withMessages([
                'body' => 'Comments are off for this stage.',
            ]);
        }

        $session = $this->activeSession($stage, $user);

        if ($session === null || $session->is_muted_by_host) {
            abort(403);
        }

        $comment = LiveStageComment::query()->create([
            'live_stage_id' => $stage->id,
            'user_id' => $user->id,
            'body' => trim($body),
        ]);

        $comment->setRelation('user', $user);
        SocialBroadcast::try(fn () => LiveStageCommentCreated::dispatch($comment));

        return $comment;
    }

    public function deleteComment(LiveStage $stage, User $actor, LiveStageComment $comment): void
    {
        $this->assertModerator($stage, $actor);

        if ((int) $comment->live_stage_id !== (int) $stage->id) {
            abort(404);
        }

        $comment->update(['deleted_at' => now(), 'deleted_by' => $actor->id]);

        $this->logModeration($stage, $actor, $comment->user_id, LiveStageModerationAction::CommentDeleted);
        SocialBroadcast::try(fn () => LiveStageCommentDeleted::dispatch($comment));
    }

    public function react(LiveStage $stage, User $user, string $emoji): void
    {
        if (! $stage->isLive()) {
            throw ValidationException::withMessages([
                'stage' => 'This stage is not live.',
            ]);
        }

        if (! (bool) ($stage->settings['allow_reactions'] ?? true)) {
            throw ValidationException::withMessages([
                'emoji' => 'Reactions are off for this stage.',
            ]);
        }

        if (! in_array($emoji, self::REACTIONS, true)) {
            throw ValidationException::withMessages([
                'emoji' => 'Pick one of the stage reactions.',
            ]);
        }

        if ($this->activeSession($stage, $user) === null) {
            abort(403);
        }

        $this->incrementReactionTotal($stage, $emoji);

        SocialBroadcast::try(fn () => LiveStageReactionCreated::dispatch($stage, $emoji));
    }

    /**
     * Atomic UPDATE ... total = total + 1 first (the common case once the row
     * exists); only falls back to inserting a new row the first time a given
     * emoji is thrown on this stage. The insert is racy under true concurrency
     * (two first-reactions for the same emoji landing at once), so a unique-
     * constraint collision there just means "someone else's insert won" —
     * retry the increment rather than treating it as a failure.
     */
    private function incrementReactionTotal(LiveStage $stage, string $emoji): void
    {
        $updated = LiveStageReactionTotal::query()
            ->where('live_stage_id', $stage->id)
            ->where('emoji', $emoji)
            ->increment('total');

        if ($updated > 0) {
            return;
        }

        try {
            LiveStageReactionTotal::query()->create([
                'live_stage_id' => $stage->id,
                'emoji' => $emoji,
                'total' => 1,
            ]);
        } catch (UniqueConstraintViolationException) {
            LiveStageReactionTotal::query()
                ->where('live_stage_id', $stage->id)
                ->where('emoji', $emoji)
                ->increment('total');
        }
    }

    public function muteViewer(LiveStage $stage, User $host, User $target, bool $muted): void
    {
        $this->assertModerator($stage, $host);

        $session = $this->activeSession($stage, $target);

        if ($session === null) {
            throw ValidationException::withMessages(['user' => 'That viewer is not in this stage.']);
        }

        $session->is_muted_by_host = $muted;
        $session->save();

        $this->logModeration(
            $stage,
            $host,
            $target->id,
            $muted ? LiveStageModerationAction::ViewerMuted : LiveStageModerationAction::ViewerUnmuted,
        );

        SocialBroadcast::try(fn () => LiveStageViewerModerated::dispatch(
            $stage,
            $target->id,
            $muted ? LiveStageModerationAction::ViewerMuted : LiveStageModerationAction::ViewerUnmuted,
        ));
    }

    public function removeViewer(LiveStage $stage, User $host, User $target, bool $ban = false): void
    {
        $this->assertModerator($stage, $host);

        $session = $this->activeSession($stage, $target);

        if ($session === null) {
            return;
        }

        $session->left_at = now();

        if ($ban) {
            $session->banned_at = now();
        }

        $session->save();

        $this->logModeration(
            $stage,
            $host,
            $target->id,
            $ban ? LiveStageModerationAction::ViewerBanned : LiveStageModerationAction::ViewerRemoved,
        );

        SocialBroadcast::try(fn () => LiveStageViewerModerated::dispatch(
            $stage,
            $target->id,
            $ban ? LiveStageModerationAction::ViewerBanned : LiveStageModerationAction::ViewerRemoved,
        ));

        $this->broadcastViewerCount($stage);
    }

    /**
     * `$guestId` is only consulted when `$user` is null — a stable-per-browser-
     * session identifier (see LiveStageMediaTokenController) so a guest's
     * LiveKit participant identity doesn't churn on every reload. Guests never
     * get a host/publish token; there is no host without an account.
     *
     * @return array{token: string, url: string, room: string, identity: string, expires_at: int}
     */
    public function issueMediaToken(LiveStage $stage, ?User $user, ?string $guestId = null): array
    {
        if ($user === null) {
            return $this->media->createGuestViewerToken($stage, (string) $guestId);
        }

        if ($stage->isHost($user)) {
            return $this->media->createHostToken($stage, $user);
        }

        return $this->media->createViewerToken($stage, $user);
    }

    /**
     * A guest is never tracked as a viewer session row (no user_id to key it
     * on) — always null, which every caller already treats as "not a member
     * of this stage's presence roster".
     */
    public function activeSession(LiveStage $stage, ?User $user): ?LiveStageViewerSession
    {
        if ($user === null) {
            return null;
        }

        return LiveStageViewerSession::query()
            ->where('live_stage_id', $stage->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();
    }

    /**
     * Live roster for the host's Viewers panel — active sessions only, most
     * recently joined first. Returned user ids are exactly what
     * muteViewer()/removeViewer() expect as their `$target`.
     *
     * @return list<array<string, mixed>>
     */
    public function activeViewers(LiveStage $stage): array
    {
        $this->pruneStaleViewers($stage);

        return LiveStageViewerSession::query()
            ->where('live_stage_id', $stage->id)
            ->whereNull('left_at')
            ->whereNotNull('user_id')
            ->with('user:id,name,handle,fan_id,avatar_path,avatar_emoji')
            ->orderByDesc('joined_at')
            ->get()
            ->map(fn (LiveStageViewerSession $session): array => [
                'user' => $this->presentUser($session->user),
                'joined_at' => $session->joined_at?->toIso8601String(),
                'is_muted_by_host' => (bool) $session->is_muted_by_host,
            ])
            ->all();
    }

    /**
     * Host-only: edit title/description/visibility and the allow_comments /
     * allow_reactions toggles, live or in draft. Broadcasts so viewers and
     * any co-host tabs pick up the change without a manual refresh.
     *
     * @param  array{title?: string, description?: ?string, is_public?: bool, allow_comments?: bool, allow_reactions?: bool}  $data
     */
    public function updateSettings(LiveStage $stage, User $actor, array $data): LiveStage
    {
        $this->assertHost($stage, $actor);

        $update = [];

        if (array_key_exists('title', $data)) {
            $update['title'] = trim((string) $data['title']);
        }

        if (array_key_exists('description', $data)) {
            $update['description'] = filled($data['description']) ? trim((string) $data['description']) : null;
        }

        if (array_key_exists('is_public', $data)) {
            $update['is_public'] = (bool) $data['is_public'];
        }

        if (array_key_exists('allow_comments', $data) || array_key_exists('allow_reactions', $data)) {
            $settings = $stage->settings ?? [];

            if (array_key_exists('allow_comments', $data)) {
                $settings['allow_comments'] = (bool) $data['allow_comments'];
            }

            if (array_key_exists('allow_reactions', $data)) {
                $settings['allow_reactions'] = (bool) $data['allow_reactions'];
            }

            $update['settings'] = $settings;
        }

        if ($update === []) {
            return $stage;
        }

        $stage->update($update);

        $stage = $stage->fresh();
        SocialBroadcast::try(fn () => LiveStageUpdated::dispatch($stage));

        return $stage;
    }

    public function viewerCount(LiveStage $stage): int
    {
        return LiveStageViewerSession::query()
            ->where('live_stage_id', $stage->id)
            ->whereNull('left_at')
            ->count();
    }

    /**
     * Total "likes" — every reaction ever thrown on this stage, across all
     * emoji. The baseline for a fresh page load; the client increments it by
     * one per `.reaction.created` broadcast for the realtime count in between
     * reads, same split as viewer_count/`.viewer-count.updated`.
     */
    public function reactionCount(LiveStage $stage): int
    {
        return (int) LiveStageReactionTotal::query()
            ->where('live_stage_id', $stage->id)
            ->sum('total');
    }

    private function broadcastViewerCount(LiveStage $stage): void
    {
        SocialBroadcast::try(fn () => LiveStageViewerCountUpdated::dispatch($stage, $this->viewerCount($stage)));
    }

    private function assertHost(LiveStage $stage, User $user): void
    {
        if (! $stage->isHost($user)) {
            throw ValidationException::withMessages(['stage' => 'Only the host can do that.']);
        }
    }

    /**
     * Host or a granted moderator/co-host.
     */
    private function assertModerator(LiveStage $stage, User $user): void
    {
        if ($stage->isHost($user)) {
            return;
        }

        $isStaff = $stage->staff()->where('user_id', $user->id)->exists();

        if (! $isStaff) {
            abort(403);
        }
    }

    private function logModeration(
        LiveStage $stage,
        User $actor,
        ?int $targetUserId,
        LiveStageModerationAction $action,
        ?string $reason = null,
    ): void {
        LiveStageModerationLog::query()->create([
            'live_stage_id' => $stage->id,
            'actor_id' => $actor->id,
            'target_user_id' => $targetUserId,
            'action' => $action,
            'reason' => $reason,
            'created_at' => now(),
        ]);
    }

    /**
     * Network-wide "Live Now" discovery — only implemented stage types, only
     * currently-live, public stages.
     *
     * @return list<array<string, mixed>>
     */
    public function presentLiveNow(): array
    {
        $stages = LiveStage::query()
            ->where('status', LiveStageStatus::Live)
            ->where('is_public', true)
            ->whereIn('type', array_map(fn (LiveStageType $t) => $t->value, LiveStageTypeConfig::implemented()))
            ->with(['host:id,name,handle,fan_id,avatar_path,avatar_emoji'])
            ->orderByDesc('started_at')
            ->limit(50)
            ->get();

        return $stages->map(fn (LiveStage $stage): array => $this->presentCard($stage))->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentCard(LiveStage $stage): array
    {
        return [
            'id' => $stage->id,
            'type' => $stage->type->value,
            'title' => $stage->title,
            'status' => $stage->status->value,
            'is_live' => $stage->isLive(),
            'host' => $this->presentUser($stage->host),
            'viewer_count' => $stage->isLive() ? $this->viewerCount($stage) : 0,
            'started_at' => $stage->started_at?->toIso8601String(),
        ];
    }

    /**
     * Full Inertia payload for the Studio (host) or Viewer (everyone else) page.
     *
     * @return array<string, mixed>
     */
    public function presentStage(LiveStage $stage, ?User $viewer): array
    {
        $stage->loadMissing(['host:id,name,handle,fan_id,avatar_path,avatar_emoji']);

        $isHost = $stage->isHost($viewer);
        $config = LiveStageTypeConfig::for($stage->type);
        $session = $this->activeSession($stage, $viewer);

        return [
            'id' => $stage->id,
            'type' => $stage->type->value,
            'type_config' => $config,
            'title' => $stage->title,
            'description' => $stage->description,
            'status' => $stage->status->value,
            'is_live' => $stage->isLive(),
            'is_host' => $isHost,
            'is_public' => (bool) $stage->is_public,
            'host' => $this->presentUser($stage->host),
            'settings' => [
                'allow_comments' => (bool) ($stage->settings['allow_comments'] ?? true),
                'allow_reactions' => (bool) ($stage->settings['allow_reactions'] ?? true),
            ],
            'viewer_count' => $stage->isLive() ? $this->viewerCount($stage) : 0,
            'reaction_count' => $this->reactionCount($stage),
            'reaction_options' => self::REACTIONS,
            'me' => $session ? [
                'is_muted_by_host' => (bool) $session->is_muted_by_host,
                'joined_at' => $session->joined_at?->toIso8601String(),
            ] : null,
            'started_at' => $stage->started_at?->toIso8601String(),
            'ended_at' => $stage->ended_at?->toIso8601String(),
            'max_title_length' => self::MAX_TITLE_LENGTH,
            'max_description_length' => self::MAX_DESCRIPTION_LENGTH,
            'max_comment_length' => self::MAX_COMMENT_LENGTH,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentRecentComments(LiveStage $stage): array
    {
        return LiveStageComment::query()
            ->where('live_stage_id', $stage->id)
            ->whereNull('deleted_at')
            ->with(['user:id,name,handle,fan_id,avatar_path,avatar_emoji'])
            ->orderByDesc('id')
            ->limit(self::COMMENTS_PAGE_SIZE)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (LiveStageComment $comment): array => $this->presentComment($comment))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentComment(LiveStageComment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'created_at' => $comment->created_at?->toIso8601String(),
            'user' => $this->presentUser($comment->user),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function presentUser(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'handle' => $user->handle,
            'fan_id' => $user->fan_id,
            'avatar_emoji' => $user->avatar_emoji,
            'avatar_url' => $user->avatar_url,
        ];
    }
}
