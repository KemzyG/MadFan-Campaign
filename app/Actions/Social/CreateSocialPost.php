<?php

namespace App\Actions\Social;

use App\Enums\MediaType;
use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\ReplyScope;
use App\Models\Follow;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\SocialNotification;
use App\Models\User;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CreateSocialPost
{
    public function __construct(
        private AwardSocialPoints $awardSocialPoints,
        private CreateSocialNotification $notifications,
    ) {}

    /**
     * @param  array{body?: string|null, reply_to_id?: int|null, images?: list<UploadedFile>|null, visibility?: string|null, reply_scope?: string|null, tagged?: list<int>|null, stage_id?: int|null}  $data
     */
    public function handle(User $author, array $data): Post
    {
        if ($author->favourite_fandom_id === null) {
            throw new InvalidArgumentException('Favourite fandom is required before posting.');
        }

        $replyToId = $data['reply_to_id'] ?? null;
        $body = isset($data['body']) ? trim((string) $data['body']) : '';
        /** @var list<UploadedFile> $images */
        $images = array_values(array_filter($data['images'] ?? []));
        $stageId = $replyToId === null ? ($data['stage_id'] ?? null) : null;

        if ($body === '' && $images === [] && $replyToId === null && $stageId === null) {
            throw new InvalidArgumentException('Post body or images are required.');
        }

        // Top-level posts carry composer settings; replies inherit the parent thread's context.
        $visibility = $replyToId === null
            ? (PostVisibility::tryFrom((string) ($data['visibility'] ?? '')) ?? PostVisibility::Public)
            : PostVisibility::Public;
        $replyScope = $replyToId === null
            ? (ReplyScope::tryFrom((string) ($data['reply_scope'] ?? '')) ?? ReplyScope::Everyone)
            : ReplyScope::Everyone;
        /** @var list<int> $tagged */
        $tagged = $replyToId === null ? array_values(array_unique(array_map('intval', $data['tagged'] ?? []))) : [];

        $parentAuthor = null;
        $taggedUsers = collect();

        $post = DB::transaction(function () use ($author, $body, $replyToId, $images, $stageId, $visibility, $replyScope, $tagged, &$parentAuthor, &$taggedUsers): Post {
            $parent = null;

            if ($replyToId !== null) {
                $parent = Post::query()
                    ->visible()
                    ->with('author')
                    ->findOrFail($replyToId);

                $parent->increment('replies_count');

                // A reply to a reply only bumped the immediate parent's count,
                // so the root post's card — the "comments" total fans actually
                // see in the feed — silently undercounted every nested reply.
                // Bump the root too whenever it isn't the parent itself.
                $rootId = $parent->root_id ?? $parent->id;

                if ($rootId !== $parent->id) {
                    Post::query()->whereKey($rootId)->increment('replies_count');
                }

                $parentAuthor = $parent->author;
            }

            $post = Post::query()->create([
                'author_id' => $author->id,
                'club_id' => $parent?->club_id ?? $author->favourite_club_id,
                'fandom_id' => $parent?->fandom_id ?? $author->favourite_fandom_id,
                'stage_id' => $stageId,
                'type' => PostType::Status,
                'visibility' => $visibility,
                'reply_scope' => $replyScope,
                'body' => $body !== '' ? $body : null,
                'reply_to_id' => $parent?->id,
                'root_id' => $parent ? ($parent->root_id ?? $parent->id) : null,
                'published_at' => now(),
            ]);

            foreach ($images as $index => $file) {
                $path = CloudinaryImageStorage::storeMedia($file, 'social/posts/'.$post->id);
                $type = $this->mediaTypeFor($file);
                $width = null;
                $height = null;

                if ($type !== MediaType::Video) {
                    $size = @getimagesize($file->getRealPath()) ?: [null, null];
                    $width = $size[0] ?? null;
                    $height = $size[1] ?? null;
                }

                PostMedia::query()->create([
                    'post_id' => $post->id,
                    'type' => $type,
                    'path' => $path,
                    'width' => $width,
                    'height' => $height,
                    'sort_order' => $index,
                    'created_at' => now(),
                ]);
            }

            if ($tagged !== []) {
                // Only people the author actually follows can be tagged.
                $followedIds = Follow::query()
                    ->where('follower_id', $author->id)
                    ->whereIn('following_id', $tagged)
                    ->pluck('following_id');

                if ($followedIds->isNotEmpty()) {
                    $post->taggedUsers()->sync($followedIds->all());
                    $taggedUsers = User::query()->whereKey($followedIds)->get();
                }
            }

            return $post->load('media');
        });

        if ($replyToId !== null) {
            $this->awardSocialPoints->forReply($author, $post->id, (string) $post->body);

            if ($parentAuthor !== null) {
                $this->notifications->notify(
                    $parentAuthor,
                    $author,
                    SocialNotification::TYPE_POST_REPLIED,
                    $post,
                    ['snippet' => str((string) $post->body)->limit(80)->toString()],
                );
            }
        } else {
            $this->awardSocialPoints->forPost($author, $post->id);
        }

        foreach ($taggedUsers as $taggedUser) {
            $this->notifications->notify(
                $taggedUser,
                $author,
                SocialNotification::TYPE_POST_TAGGED,
                $post,
                ['snippet' => str((string) $post->body)->limit(80)->toString()],
            );
        }

        return $post;
    }

    private function mediaTypeFor(UploadedFile $file): MediaType
    {
        $mime = strtolower((string) $file->getMimeType());

        if (str_starts_with($mime, 'video/')) {
            return MediaType::Video;
        }

        if ($mime === 'image/gif' || strtolower($file->getClientOriginalExtension()) === 'gif') {
            return MediaType::Gif;
        }

        return MediaType::Image;
    }
}
