<?php

namespace App\Services\Social;

use App\Enums\StageParticipantRole;
use App\Enums\StageSignalType;
use App\Enums\StageStatus;
use App\Events\Social\StageMessageCreated;
use App\Events\Social\StageRoomUpdated;
use App\Events\Social\StageSignalCreated;
use App\Models\Stage;
use App\Models\StageMessage;
use App\Models\StageParticipant;
use App\Models\StageSignal;
use App\Models\User;
use App\Support\SocialRealtime;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StageService
{
    public const MAX_SPEAKERS = 8;

    public const MAX_TITLE_LENGTH = 80;

    public const MAX_MESSAGE_LENGTH = 280;

    public const POLL_INTERVAL_MS = 3000;

    public const SIGNAL_POLL_MS = 1500;

    public const MESSAGES_LIMIT = 80;

    /**
     * Network-wide live Stage lobby — every live room is visible to Social fans.
     * Intentionally not scoped by the viewer's favourite club (club_id is host metadata).
     *
     * @return list<array<string, mixed>>
     */
    public function presentLiveStages(): array
    {
        $stages = Stage::query()
            ->where('status', StageStatus::Live)
            ->with([
                'host:id,name,handle,fan_id,avatar_path,avatar_emoji',
                'club:id,name,short,logo',
            ])
            ->withCount([
                'participants as listener_count' => fn ($q) => $q->whereNull('left_at')->where('role', StageParticipantRole::Listener),
                'participants as speaker_count' => fn ($q) => $q->whereNull('left_at')->whereIn('role', [
                    StageParticipantRole::Host,
                    StageParticipantRole::Speaker,
                ]),
                'participants as participant_count' => fn ($q) => $q->whereNull('left_at'),
            ])
            ->orderByDesc('started_at')
            ->limit(50)
            ->get();

        return $stages->map(fn (Stage $stage): array => $this->presentStageSummary($stage))->all();
    }

    public function create(User $host, string $title): Stage
    {
        return DB::transaction(function () use ($host, $title): Stage {
            $stage = Stage::query()->create([
                'host_id' => $host->id,
                'club_id' => $host->favourite_club_id,
                'title' => $title,
                'status' => StageStatus::Live,
                'voice_enabled' => false,
                'started_at' => now(),
            ]);

            StageParticipant::query()->create([
                'stage_id' => $stage->id,
                'user_id' => $host->id,
                'role' => StageParticipantRole::Host,
                'is_muted' => true,
                'joined_at' => now(),
                'last_seen_at' => now(),
            ]);

            $stage = $stage->fresh(['host', 'club']);
            StageRoomUpdated::dispatch($stage, 'created');

            return $stage;
        });
    }

    public function join(Stage $stage, User $user): StageParticipant
    {
        if (! $stage->isLive()) {
            throw ValidationException::withMessages([
                'stage' => 'This Stage has ended.',
            ]);
        }

        $participant = StageParticipant::query()->firstOrNew([
            'stage_id' => $stage->id,
            'user_id' => $user->id,
        ]);

        if ($participant->exists && $participant->left_at === null) {
            $participant->last_seen_at = now();
            $participant->save();

            return $participant;
        }

        $isHost = (int) $stage->host_id === (int) $user->id;

        $participant->fill([
            'role' => $isHost ? StageParticipantRole::Host : StageParticipantRole::Listener,
            'is_muted' => true,
            'speak_requested_at' => null,
            'joined_at' => now(),
            'left_at' => null,
            'last_seen_at' => now(),
        ]);
        $participant->save();

        StageRoomUpdated::dispatch($stage->fresh(), 'joined');

        return $participant;
    }

    public function leave(Stage $stage, User $user): void
    {
        $participant = $this->activeParticipant($stage, $user);

        if ($participant === null) {
            return;
        }

        if ($participant->role === StageParticipantRole::Host && $stage->isLive()) {
            $this->end($stage, $user);

            return;
        }

        $participant->left_at = now();
        $participant->speak_requested_at = null;
        $participant->save();

        StageRoomUpdated::dispatch($stage->fresh(), 'left');
    }

    public function end(Stage $stage, User $user): void
    {
        if ((int) $stage->host_id !== (int) $user->id) {
            abort(403);
        }

        DB::transaction(function () use ($stage): void {
            $stage->update([
                'status' => StageStatus::Ended,
                'ended_at' => now(),
                'voice_enabled' => false,
            ]);

            StageParticipant::query()
                ->where('stage_id', $stage->id)
                ->whereNull('left_at')
                ->update(['left_at' => now()]);

            StageSignal::query()
                ->where('stage_id', $stage->id)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);
        });

        StageRoomUpdated::dispatch($stage->fresh(), 'ended');
    }

    public function startVoice(Stage $stage, User $user): void
    {
        if ((int) $stage->host_id !== (int) $user->id || ! $stage->isLive()) {
            abort(403);
        }

        $stage->update(['voice_enabled' => true]);

        $host = $this->activeParticipant($stage, $user);
        if ($host !== null) {
            $host->is_muted = false;
            $host->save();
        }

        StageRoomUpdated::dispatch($stage->fresh(), 'voice');
    }

    public function requestSpeak(Stage $stage, User $user): void
    {
        $participant = $this->activeParticipant($stage, $user);

        if ($participant === null || $participant->role !== StageParticipantRole::Listener) {
            throw ValidationException::withMessages([
                'speak' => 'Only listeners can request the mic.',
            ]);
        }

        $participant->speak_requested_at = now();
        $participant->save();

        StageRoomUpdated::dispatch($stage->fresh(), 'speak_request');
    }

    public function promote(Stage $stage, User $host, User $target): void
    {
        if ((int) $stage->host_id !== (int) $host->id || ! $stage->isLive()) {
            abort(403);
        }

        if ((int) $host->id === (int) $target->id) {
            return;
        }

        if ($this->activeSpeakerCount($stage) >= self::MAX_SPEAKERS) {
            throw ValidationException::withMessages([
                'speakers' => 'Stage is full (max '.self::MAX_SPEAKERS.' speakers for mesh voice).',
            ]);
        }

        $participant = $this->activeParticipant($stage, $target);

        if ($participant === null) {
            throw ValidationException::withMessages([
                'user' => 'That fan is not in this Stage.',
            ]);
        }

        $participant->role = StageParticipantRole::Speaker;
        $participant->speak_requested_at = null;
        $participant->is_muted = true;
        $participant->save();

        StageRoomUpdated::dispatch($stage->fresh(), 'promote');
    }

    public function demote(Stage $stage, User $host, User $target): void
    {
        if ((int) $stage->host_id !== (int) $host->id || ! $stage->isLive()) {
            abort(403);
        }

        if ((int) $host->id === (int) $target->id) {
            throw ValidationException::withMessages([
                'user' => 'Host stays on stage.',
            ]);
        }

        $participant = $this->activeParticipant($stage, $target);

        if ($participant === null) {
            return;
        }

        $participant->role = StageParticipantRole::Listener;
        $participant->is_muted = true;
        $participant->speak_requested_at = null;
        $participant->save();

        StageRoomUpdated::dispatch($stage->fresh(), 'demote');
    }

    public function setMuted(Stage $stage, User $user, bool $muted): void
    {
        $participant = $this->activeParticipant($stage, $user);

        if ($participant === null || ! $participant->isOnStage()) {
            abort(403);
        }

        $participant->is_muted = $muted;
        $participant->save();

        StageRoomUpdated::dispatch($stage->fresh(), 'mute');
    }

    public function heartbeat(Stage $stage, User $user): void
    {
        StageParticipant::query()
            ->where('stage_id', $stage->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->update(['last_seen_at' => now()]);
    }

    public function storeMessage(Stage $stage, User $user, string $body): StageMessage
    {
        $message = StageMessage::query()->create([
            'stage_id' => $stage->id,
            'user_id' => $user->id,
            'body' => $body,
        ]);

        $message->load('user');
        StageMessageCreated::dispatch($message);

        return $message;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function storeSignal(Stage $stage, User $from, User $to, StageSignalType $type, array $payload): StageSignal
    {
        if ((int) $from->id === (int) $to->id) {
            throw ValidationException::withMessages([
                'to_user_id' => 'Cannot signal yourself.',
            ]);
        }

        $fromPart = $this->activeParticipant($stage, $from);
        $toPart = $this->activeParticipant($stage, $to);

        if ($fromPart === null || $toPart === null) {
            throw ValidationException::withMessages([
                'signal' => 'Both peers must be in the Stage.',
            ]);
        }

        $signal = StageSignal::query()->create([
            'stage_id' => $stage->id,
            'from_user_id' => $from->id,
            'to_user_id' => $to->id,
            'type' => $type,
            'payload' => $payload,
        ]);

        StageSignalCreated::dispatch($signal);

        return $signal;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function drainSignals(Stage $stage, User $user): array
    {
        return DB::transaction(function () use ($stage, $user): array {
            $signals = StageSignal::query()
                ->where('stage_id', $stage->id)
                ->where('to_user_id', $user->id)
                ->whereNull('consumed_at')
                ->orderBy('id')
                ->limit(100)
                ->lockForUpdate()
                ->get();

            if ($signals->isEmpty()) {
                return [];
            }

            $ids = $signals->pluck('id')->all();
            StageSignal::query()->whereIn('id', $ids)->update(['consumed_at' => now()]);

            return $signals->map(fn (StageSignal $signal): array => [
                'id' => $signal->id,
                'from_user_id' => $signal->from_user_id,
                'type' => $signal->type->value,
                'payload' => $signal->payload,
                'created_at' => $signal->created_at?->toIso8601String(),
            ])->all();
        });
    }

    public function activeParticipant(Stage $stage, User $user): ?StageParticipant
    {
        return StageParticipant::query()
            ->where('stage_id', $stage->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();
    }

    public function activeSpeakerCount(Stage $stage): int
    {
        return StageParticipant::query()
            ->where('stage_id', $stage->id)
            ->whereNull('left_at')
            ->whereIn('role', [StageParticipantRole::Host, StageParticipantRole::Speaker])
            ->count();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentRoom(Stage $stage, User $viewer): array
    {
        $stage->loadMissing([
            'host:id,name,handle,fan_id,avatar_path,avatar_emoji',
            'club:id,name,short,logo',
        ]);

        $participants = StageParticipant::query()
            ->where('stage_id', $stage->id)
            ->whereNull('left_at')
            ->with(['user:id,name,handle,fan_id,avatar_path,avatar_emoji'])
            ->orderByRaw("CASE role WHEN 'host' THEN 0 WHEN 'speaker' THEN 1 ELSE 2 END")
            ->orderBy('joined_at')
            ->get();

        $messages = StageMessage::query()
            ->where('stage_id', $stage->id)
            ->with(['user:id,name,handle,fan_id,avatar_path,avatar_emoji'])
            ->orderByDesc('id')
            ->limit(self::MESSAGES_LIMIT)
            ->get()
            ->reverse()
            ->values();

        $me = $participants->firstWhere('user_id', $viewer->id);

        return [
            'stage' => [
                'id' => $stage->id,
                'title' => $stage->title,
                'status' => $stage->status->value,
                'voice_enabled' => $stage->voice_enabled,
                'started_at' => $stage->started_at?->toIso8601String(),
                'ended_at' => $stage->ended_at?->toIso8601String(),
                'host' => $this->presentUser($stage->host),
                'club' => $stage->club ? [
                    'id' => $stage->club->id,
                    'name' => $stage->club->name,
                    'short' => $stage->club->short,
                ] : null,
                'max_speakers' => self::MAX_SPEAKERS,
                'speaker_count' => $participants->filter(fn (StageParticipant $p) => $p->isOnStage())->count(),
                'participant_count' => $participants->count(),
            ],
            'participants' => $participants->map(fn (StageParticipant $p): array => $this->presentParticipant($p))->values()->all(),
            'messages' => $messages->map(fn (StageMessage $m): array => $this->presentMessage($m))->all(),
            'me' => $me ? $this->presentParticipant($me) : null,
            'voice' => [
                'mode' => SocialRealtime::enabled() ? 'webrtc_mesh_reverb' : 'webrtc_mesh_poll',
                'enabled' => $stage->voice_enabled,
                'max_speakers' => self::MAX_SPEAKERS,
                // When Reverb pushes signals, HTTP poll is a sparse fallback only.
                'signal_poll_ms' => SocialRealtime::enabled() ? max(self::SIGNAL_POLL_MS * 10, 15000) : self::SIGNAL_POLL_MS,
                'note' => SocialRealtime::stageMeta()['note'].' Cap '.self::MAX_SPEAKERS.' speakers. STUN only; may fail behind strict NAT.',
            ],
            'realtime' => SocialRealtime::stageMeta(),
            'max_message_length' => self::MAX_MESSAGE_LENGTH,
            'poll_ms' => SocialRealtime::enabled() ? max(self::POLL_INTERVAL_MS * 8, 20000) : self::POLL_INTERVAL_MS,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentStageSummary(Stage $stage): array
    {
        return [
            'id' => $stage->id,
            'title' => $stage->title,
            'status' => $stage->status->value,
            'voice_enabled' => (bool) $stage->voice_enabled,
            'started_at' => $stage->started_at?->toIso8601String(),
            'host' => $this->presentUser($stage->host),
            'club' => $stage->club ? [
                'id' => $stage->club->id,
                'name' => $stage->club->name,
                'short' => $stage->club->short,
            ] : null,
            'speaker_count' => (int) ($stage->speaker_count ?? 0),
            'listener_count' => (int) ($stage->listener_count ?? 0),
            'participant_count' => (int) ($stage->participant_count ?? 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentParticipant(StageParticipant $participant): array
    {
        return [
            'id' => $participant->id,
            'user_id' => $participant->user_id,
            'role' => $participant->role->value,
            'is_muted' => $participant->is_muted,
            'speak_requested_at' => $participant->speak_requested_at?->toIso8601String(),
            'joined_at' => $participant->joined_at?->toIso8601String(),
            'user' => $this->presentUser($participant->user),
            'on_stage' => $participant->isOnStage(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentMessage(StageMessage $message): array
    {
        return [
            'id' => $message->id,
            'body' => $message->body,
            'created_at' => $message->created_at?->toIso8601String(),
            'user' => $this->presentUser($message->user),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function presentUser(?User $user): ?array
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
