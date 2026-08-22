<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\User;
use App\Models\VideoHighlight;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Idempotent sample reels / highlight clips for the vertical video feed.
 */
class VideoHighlightSeeder extends Seeder
{
    /**
     * @var list<array{short: string, title: string, caption: string, video_url: string, featured?: bool}>
     */
    private const CLIPS = [
        [
            'short' => 'LIV',
            'title' => 'Counter from the press',
            'caption' => 'First-phase regain → vertical third-man run. Terrace POV.',
            'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-soccer-player-dribbling-the-ball-209-large.mp4',
            'featured' => true,
        ],
        [
            'short' => 'ARS',
            'title' => 'Half-space overload',
            'caption' => 'Inverted eight drops, wide forward pins the full-back.',
            'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-man-playing-soccer-502-large.mp4',
            'featured' => true,
        ],
        [
            'short' => 'MCI',
            'title' => 'Switch and isolate',
            'caption' => 'Second switch opens the weak-side 1v1 — cutback chance.',
            'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-football-player-kicking-the-ball-2091-large.mp4',
        ],
        [
            'short' => 'RMA',
            'title' => 'Late runner timing',
            'caption' => 'Free eight arrives at the back post on the cutback.',
            'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-young-man-playing-soccer-2190-large.mp4',
        ],
        [
            'short' => 'CHE',
            'title' => 'Set-piece structure',
            'caption' => 'Near-post flick-on, far-post recycle — xG from dead ball.',
            'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-goalkeeper-saving-a-penalty-kick-2092-large.mp4',
        ],
        [
            'short' => 'BAR',
            'title' => 'Positional superiority',
            'caption' => 'Centre-back steps into midfield to maintain tempo under press.',
            'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-soccer-player-training-on-the-field-2090-large.mp4',
        ],
    ];

    public function run(): void
    {
        $author = $this->resolveAuthor();
        $seeded = 0;

        foreach (self::CLIPS as $clip) {
            $club = Club::query()->where('short', $clip['short'])->first();

            if ($club === null) {
                $this->command?->warn("VideoHighlightSeeder skipped {$clip['short']}: club not found.");

                continue;
            }

            VideoHighlight::query()->updateOrCreate(
                [
                    'club_id' => $club->id,
                    'title' => $clip['title'],
                ],
                [
                    'author_id' => $author->id,
                    'caption' => $clip['caption'],
                    'video_url' => $clip['video_url'],
                    'thumbnail_url' => null,
                    'duration_seconds' => 15,
                    'likes_count' => crc32($clip['title']) % 400 + 24,
                    'views_count' => crc32($clip['title']) % 4000 + 200,
                    'is_featured' => $clip['featured'] ?? false,
                    'published_at' => now()->subDays(crc32($clip['short']) % 10),
                ],
            );

            $seeded++;
        }

        $this->command?->info("Video highlights ready: {$seeded} reels.");
    }

    private function resolveAuthor(): User
    {
        return User::query()->updateOrCreate(
            ['email' => 'highlights@madfan.test'],
            [
                'name' => 'Mad Fan Highlights',
                'username' => 'highlights',
                'handle' => 'highlights',
                'password_hash' => Hash::make('HighlightSeed123!'),
                'auth_provider' => 'password',
                'fan_id' => 'MF-HLITE',
                'bio' => 'Official match highlights and tactical clips.',
                'email_verified_at' => now(),
                'social_onboarded_at' => now(),
            ],
        );
    }
}
