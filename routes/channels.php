<?php

use App\Models\Channel;
use App\Models\LiveStage;
use App\Models\Stage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use App\Services\Social\StageService;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('social.notifications.{userId}', function (User $user, int $userId): bool {
    return $user->id === $userId;
});

Broadcast::channel('social.chat.{channelId}', function (User $user, int $channelId): bool {
    $channel = Channel::query()->find($channelId);

    if ($channel === null) {
        return false;
    }

    return $user->can('view', $channel);
});

Broadcast::channel('social.stage.{stageId}', function (User $user, int $stageId): bool {
    $stage = Stage::query()->find($stageId);

    if ($stage === null) {
        return false;
    }

    return app(StageService::class)->activeParticipant($stage, $user) !== null;
});

// Per-recipient WebRTC signal channel — a signal (SDP/ICE) is meant for
// exactly one participant, so it broadcasts here instead of the shared room
// channel above (see StageSignalCreated::broadcastOn). Only that user, and
// only while still an active participant, may subscribe.
Broadcast::channel('social.stage.{stageId}.user.{userId}', function (User $user, int $stageId, int $userId): bool {
    if ($user->id !== $userId) {
        return false;
    }

    $stage = Stage::query()->find($stageId);

    if ($stage === null) {
        return false;
    }

    return app(StageService::class)->activeParticipant($stage, $user) !== null;
});

Broadcast::channel('live-stage.{stageId}', function (User $user, int $stageId): bool {
    $stage = LiveStage::query()->find($stageId);

    if ($stage === null) {
        return false;
    }

    if ($stage->isHost($user)) {
        return true;
    }

    return app(LiveStageService::class)->activeSession($stage, $user) !== null;
});
