<?php

namespace App\Actions\Social;

use App\Events\Social\SocialNotificationCreated;
use App\Models\SocialNotification;
use App\Models\User;
use App\Support\SocialBroadcast;
use Illuminate\Database\Eloquent\Model as EloquentModel;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

/**
 * Writes one notification row and broadcasts it to the recipient's private
 * channel, mirroring {@see AwardSocialPoints}'s shape: fire-and-forget,
 * failure-isolated so a notification error never breaks the primary action.
 */
class CreateSocialNotification
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function notify(
        User $recipient,
        ?User $actor,
        string $type,
        ?EloquentModel $notifiable = null,
        array $data = [],
    ): ?SocialNotification {
        // Nobody needs to be told they liked/replied/tagged themselves.
        if ($actor !== null && $actor->id === $recipient->id) {
            return null;
        }

        try {
            $notification = SocialNotification::query()->create([
                'recipient_id' => $recipient->id,
                'actor_id' => $actor?->id,
                'type' => $type,
                'notifiable_type' => $notifiable?->getMorphClass(),
                'notifiable_id' => $notifiable?->getKey(),
                'data' => $data,
            ]);
        } catch (QueryException $exception) {
            Log::warning('Social notification create failed; primary social action continues.', [
                'recipient_id' => $recipient->id,
                'type' => $type,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }

        $notification->setRelation('actor', $actor);
        $notification->setRelation('notifiable', $notifiable);

        SocialBroadcast::try(fn () => SocialNotificationCreated::dispatch($notification));

        return $notification;
    }

    /**
     * Fan-out a system notification (no actor) to many recipients at once —
     * e.g. a published announcement. One bulk insert, one broadcast per
     * recipient (each has their own private channel).
     *
     * @param  iterable<User>  $recipients
     * @param  array<string, mixed>  $data
     */
    public function notifyMany(iterable $recipients, string $type, ?EloquentModel $notifiable, array $data = []): void
    {
        $now = now();
        $rows = [];

        foreach ($recipients as $recipient) {
            $rows[] = [
                'recipient_id' => $recipient->id,
                'actor_id' => null,
                'type' => $type,
                'notifiable_type' => $notifiable?->getMorphClass(),
                'notifiable_id' => $notifiable?->getKey(),
                'data' => json_encode($data),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows === []) {
            return;
        }

        try {
            SocialNotification::query()->insert($rows);
        } catch (QueryException $exception) {
            Log::warning('Social notification bulk create failed.', [
                'type' => $type,
                'count' => count($rows),
                'error' => $exception->getMessage(),
            ]);

            return;
        }

        $inserted = SocialNotification::query()
            ->where('type', $type)
            ->where('notifiable_type', $notifiable?->getMorphClass())
            ->where('notifiable_id', $notifiable?->getKey())
            ->where('created_at', $now)
            ->get();

        foreach ($inserted as $notification) {
            $notification->setRelation('actor', null);
            $notification->setRelation('notifiable', $notifiable);

            SocialBroadcast::try(fn () => SocialNotificationCreated::dispatch($notification));
        }
    }
}
