<?php

namespace App\Actions\Social;

use App\Enums\MediaType;
use App\Enums\PostType;
use App\Enums\PostVisibility;
use App\Enums\ReplyScope;
use App\Models\Follow;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\User;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CreateSocialPost
{
    public function __construct(
        private AwardSocialPoints $awardSocialPoints,
    ) {}

    /**
     * @param  array{body?: string|null, reply_to_id?: int|null, images?: list<UploadedFile>|null, visibility?: string|null, reply_scope?: string|null, tagged?: list<int>|null, stage_id?: int|null}  $data
     */
    public function handle(User $author, array $data): Post
    {
        if ($author->favourite_club_id === null) {
            throw new InvalidArgumentException('Favourite club is required before posting.');
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

        $post = DB::transaction(function () use ($author, $body, $replyToId, $images, $stageId, $visibility, $replyScope, $tagged): Post {
            $parent = null;

            if ($replyToId !== null) {
                $parent = Post::query()
                    ->visible()
                    ->findOrFail($replyToId);

                $parent->increment('replies_count');
            }

            $post = Post::query()->create([
                'author_id' => $author->id,
                'club_id' => $parent?->club_id ?? $author->favourite_club_id,
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
                $path = CloudinaryImageStorage::store($file, 'social/posts/'.$post->id);
                $size = @getimagesize($file->getRealPath()) ?: [null, null];

                PostMedia::query()->create([
                    'post_id' => $post->id,
                    'type' => MediaType::Image,
                    'path' => $path,
                    'width' => $size[0] ?? null,
                    'height' => $size[1] ?? null,
                    'sort_order' => $index,
                    'created_at' => now(),
                ]);
            }

            if ($tagged !== []) {
                // Only people the author actually follows can be tagged.
                $followed = Follow::query()
                    ->where('follower_id', $author->id)
                    ->whereIn('following_id', $tagged)
                    ->pluck('following_id')
                    ->all();

                if ($followed !== []) {
                    $post->taggedUsers()->sync($followed);
                }
            }

            return $post->load('media');
        });

        if ($replyToId !== null) {
            $this->awardSocialPoints->forReply($author, $post->id, (string) $post->body);
        } else {
            $this->awardSocialPoints->forPost($author, $post->id);
        }

        return $post;
    }
}
