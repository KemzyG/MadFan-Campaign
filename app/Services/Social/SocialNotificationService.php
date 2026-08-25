<?php

namespace App\Services\Social;

use App\Models\Message;
use App\Models\Post;
use App\Models\SocialAnnouncement;
use App\Models\SocialNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Shapes a {@see SocialNotification} into the display payload the bell
 * dropdown, the notifications page, and the live broadcast all share.
 */
class SocialNotificationService
{
    /**
     * @return array<string, mixed>
     */
    public function present(SocialNotification $notification): array
    {
        $notification->loadMissing(['actor:id,name,handle,username,fan_id,avatar_path,avatar_emoji']);

        $actor = $notification->actor;

        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'read' => $notification->read_at !== null,
            'created_at' => $notification->created_at?->toIso8601String(),
            'actor' => $actor ? [
                'id' => $actor->id,
                'name' => $actor->name,
                'handle' => $actor->handle ?: $actor->username ?: $actor->fan_id,
                'avatar_url' => $actor->avatar_url,
            ] : null,
            'message' => $this->messageFor($notification),
            'href' => $this->hrefFor($notification),
        ];
    }

    /**
     * @param  LengthAwarePaginator<int, SocialNotification>  $paginator
     * @return array{data: list<array<string, mixed>>, meta: array<string, mixed>, links: array<string, string|null>}
     */
    public function presentPaginator(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (SocialNotification $n) => $this->present($n))->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
            'links' => [
                'next' => $paginator->nextPageUrl(),
                'prev' => $paginator->previousPageUrl(),
            ],
        ];
    }

    private function messageFor(SocialNotification $notification): string
    {
        $actorName = $notification->actor?->name ?? 'Someone';

        return match ($notification->type) {
            SocialNotification::TYPE_POST_LIKED => "{$actorName} liked your post",
            SocialNotification::TYPE_POST_REPLIED => "{$actorName} replied to your post",
            SocialNotification::TYPE_POST_TAGGED => "{$actorName} tagged you in a post",
            SocialNotification::TYPE_CHAT_MESSAGE => "{$actorName} sent a message in ".
                ($notification->data['channel_name'] ?? 'a chat'),
            SocialNotification::TYPE_ANNOUNCEMENT => $notification->data['headline'] ?? 'New on the terrace',
            default => 'New notification',
        };
    }

    private function hrefFor(SocialNotification $notification): ?string
    {
        return match ($notification->notifiable_type) {
            (new Post)->getMorphClass() => '/social/posts/'.$notification->notifiable_id,
            (new Message)->getMorphClass() => isset($notification->data['channel_slug'])
                ? '/social/chat/thread/'.$notification->data['channel_slug']
                : '/social/chat',
            (new SocialAnnouncement)->getMorphClass() => $notification->data['link_url'] ?? '/social',
            default => null,
        };
    }
}
