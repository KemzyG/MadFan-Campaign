<?php

namespace App\Actions\Social;

use App\Models\User;
use App\Models\VideoHighlight;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CreateVideoHighlight
{
    /**
     * @param  array{
     *     video: UploadedFile,
     *     title?: string|null,
     *     caption?: string|null,
     *     duration_seconds?: int|null
     * }  $data
     */
    public function handle(User $author, array $data): VideoHighlight
    {
        if ($author->favourite_club_id === null) {
            throw new InvalidArgumentException('Favourite club is required before publishing a reel.');
        }

        /** @var UploadedFile $video */
        $video = $data['video'];
        $title = trim((string) ($data['title'] ?? ''));
        $caption = trim((string) ($data['caption'] ?? ''));
        $duration = isset($data['duration_seconds']) ? (int) $data['duration_seconds'] : null;

        if ($title === '') {
            $title = $caption !== ''
                ? mb_substr($caption, 0, 80)
                : 'Reel';
        }

        return DB::transaction(function () use ($author, $video, $title, $caption, $duration): VideoHighlight {
            $path = CloudinaryImageStorage::storeVideo($video, 'social/reels/'.$author->id);

            return VideoHighlight::query()->create([
                'author_id' => $author->id,
                'club_id' => $author->favourite_club_id,
                'title' => $title,
                'caption' => $caption !== '' ? $caption : null,
                'video_url' => $path,
                'thumbnail_url' => null,
                'duration_seconds' => $duration,
                'likes_count' => 0,
                'views_count' => 0,
                'is_featured' => false,
                'published_at' => now(),
            ]);
        });
    }
}
