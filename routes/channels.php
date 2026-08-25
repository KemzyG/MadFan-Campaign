<?php

use App\Models\Channel;
use App\Models\Stage;
use App\Models\User;
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
