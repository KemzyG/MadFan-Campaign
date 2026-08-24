<?php

namespace Database\Seeders;

use App\Enums\EventType;
use App\Models\Club;
use App\Models\SocialAnnouncement;
use App\Support\ApplicationSettings;
use Illuminate\Database\Seeder;

/**
 * Demo rows for the three editorial event kinds — concert, song release,
 * breaking news — which have no model of their own to project from.
 *
 * Idempotent and Faker-free (safe for ProductionCoreSeeder). Lookup key is
 * type + headline so re-runs refresh the timestamps instead of piling up
 * duplicates once `published_at` has aged out of {@see EventWindow::RECENT_DAYS}.
 */
class SocialAnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        if (! ApplicationSettings::socialNetworkEnabled()) {
            $this->command?->warn('SocialAnnouncementSeeder skipped: social network disabled.');

            return;
        }

        foreach ($this->rows() as $row) {
            $club = isset($row['club'])
                ? Club::query()->where('short', $row['club'])->first()
                : null;

            unset($row['club']);

            SocialAnnouncement::query()->updateOrCreate(
                [
                    'type' => $row['type'],
                    'headline' => $row['headline'],
                ],
                [
                    ...$row,
                    'club_id' => $club?->id,
                ],
            );
        }

        $live = SocialAnnouncement::query()->published()->current()->count();

        $this->command?->info("Social announcements ready: {$live} live on the events feed.");
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function rows(): array
    {
        return [
            [
                'type' => EventType::BreakingNews,
                'club' => 'ARS',
                'headline' => 'Deadline day: Arsenal close on a club-record signing',
                'subtitle' => 'Medical booked for tonight, announcement expected before the window shuts.',
                'link_url' => '/social',
                'link_label' => 'Read',
                'meta' => [
                    'source' => 'Mad Fan Newsroom',
                    'category' => 'Transfers',
                    'is_urgent' => true,
                ],
                'is_pinned' => false,
                'starts_at' => null,
                'ends_at' => null,
                'published_at' => now()->subMinutes(24),
            ],
            [
                'type' => EventType::BreakingNews,
                'club' => 'LIV',
                'headline' => 'Captain passes late fitness test',
                'subtitle' => 'Back in the squad after three weeks out — expected to start on the bench.',
                'link_url' => null,
                'link_label' => null,
                'meta' => [
                    'source' => 'Mad Fan Newsroom',
                    'category' => 'Injury',
                    'is_urgent' => false,
                ],
                'is_pinned' => false,
                'starts_at' => null,
                'ends_at' => null,
                'published_at' => now()->subHours(6),
            ],
            [
                'type' => EventType::Concert,
                'club' => null,
                'headline' => 'Terrace Anthems Live',
                'subtitle' => 'One night, twelve chants, a full brass section.',
                'link_url' => '/social/tickets',
                'link_label' => 'Get tickets',
                'meta' => [
                    'artist' => 'The Kop Choir',
                    'venue' => 'Roundhouse',
                    'city' => 'London',
                    'lineup' => ['The Kop Choir', 'Away End Brass'],
                ],
                'is_pinned' => false,
                'starts_at' => now()->addDays(9)->setTime(20, 0),
                'ends_at' => now()->addDays(9)->setTime(23, 30),
                'published_at' => now()->subDays(2),
            ],
            [
                'type' => EventType::Concert,
                'club' => 'MUN',
                'headline' => 'Matchday Eve Session',
                'subtitle' => 'Pre-derby warm-up set, walking distance from the ground.',
                'link_url' => '/social/tickets',
                'link_label' => 'Get tickets',
                'meta' => [
                    'artist' => 'Stretford Sound',
                    'venue' => 'Old Trafford Arena',
                    'city' => 'Manchester',
                    'lineup' => ['Stretford Sound'],
                ],
                'is_pinned' => false,
                'starts_at' => now()->addDays(3)->setTime(19, 30),
                'ends_at' => now()->addDays(3)->setTime(22, 0),
                'published_at' => now()->subDay(),
            ],
            [
                'type' => EventType::SongRelease,
                'club' => 'ARS',
                'headline' => 'North London Forever (Terrace Cut)',
                'subtitle' => null,
                'link_url' => 'https://open.spotify.com/',
                'link_label' => 'Listen',
                'meta' => [
                    'artist' => 'Louis Dunford',
                    'track' => 'North London Forever',
                    'album' => 'Terrace Cuts, Vol. 1',
                    'platform' => 'Spotify',
                ],
                'is_pinned' => false,
                'starts_at' => null,
                'ends_at' => null,
                'published_at' => now()->subHours(20),
            ],
            [
                'type' => EventType::SongRelease,
                'club' => null,
                'headline' => 'Ninety Minutes — new single out now',
                'subtitle' => 'The Mad Fan anthem, remastered for the away end.',
                'link_url' => 'https://open.spotify.com/',
                'link_label' => 'Listen',
                'meta' => [
                    'artist' => 'Mad Fan Collective',
                    'track' => 'Ninety Minutes',
                    'album' => 'Single',
                    'platform' => 'Spotify',
                ],
                'is_pinned' => true,
                'starts_at' => null,
                'ends_at' => null,
                'published_at' => now()->subDays(4),
            ],
        ];
    }
}
