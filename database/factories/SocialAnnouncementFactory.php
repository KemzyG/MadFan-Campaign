<?php

namespace Database\Factories;

use App\Enums\EventType;
use App\Models\SocialAnnouncement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SocialAnnouncement>
 */
class SocialAnnouncementFactory extends Factory
{
    protected $model = SocialAnnouncement::class;

    /**
     * Defaults to breaking news — the one kind that needs neither a start time
     * nor artwork to read correctly. Use the states below for the other two.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => EventType::BreakingNews,
            'club_id' => null,
            'headline' => fake()->sentence(6),
            'subtitle' => fake()->sentence(14),
            'image_path' => null,
            'link_url' => null,
            'link_label' => null,
            'meta' => [
                'source' => fake()->company(),
                'category' => fake()->randomElement(['Transfers', 'Injury', 'Squad', 'Board']),
                'is_urgent' => false,
            ],
            'is_pinned' => false,
            'starts_at' => null,
            'ends_at' => null,
            'published_at' => now(),
        ];
    }

    public function breakingNews(bool $urgent = false): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => EventType::BreakingNews,
            'meta' => [
                ...(array) ($attributes['meta'] ?? []),
                'is_urgent' => $urgent,
            ],
        ]);
    }

    public function concert(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => EventType::Concert,
            'headline' => fake()->words(3, true).' Live',
            'subtitle' => 'One night only.',
            'link_url' => '/social/tickets',
            'link_label' => 'Get tickets',
            'meta' => [
                'artist' => fake()->name(),
                'venue' => fake()->company().' Arena',
                'city' => fake()->city(),
                'lineup' => [fake()->firstName(), fake()->firstName()],
            ],
            'starts_at' => now()->addDays(9),
        ]);
    }

    public function songRelease(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => EventType::SongRelease,
            'headline' => 'New single out now',
            'subtitle' => null,
            'link_url' => 'https://open.spotify.com/',
            'link_label' => 'Listen',
            'meta' => [
                'artist' => fake()->name(),
                'track' => fake()->words(2, true),
                'album' => fake()->words(3, true),
                'platform' => 'Spotify',
            ],
        ]);
    }

    public function pinned(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_pinned' => true,
        ]);
    }

    /** Authored but not yet live — should stay off the feed. */
    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => null,
        ]);
    }

    /** Already expired — should stay off the feed. */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => now()->subDays(3),
            'ends_at' => now()->subDay(),
        ]);
    }
}
