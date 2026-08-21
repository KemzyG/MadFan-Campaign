<?php

namespace Database\Factories;

use App\Enums\MediaAssetSource;
use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MediaAsset>
 */
class MediaAssetFactory extends Factory
{
    protected $model = MediaAsset::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $id = fake()->unique()->bothify('gallery-????-####');

        return [
            'title' => fake()->words(3, true),
            'alt_text' => fake()->sentence(4),
            'path' => 'media/'.$id.'.jpg',
            'cloudinary_public_id' => null,
            'source' => MediaAssetSource::Upload,
            'prompt' => null,
            'mime_type' => 'image/jpeg',
            'bytes' => fake()->numberBetween(20_000, 400_000),
            'width' => 800,
            'height' => 1000,
            'uploaded_by' => null,
        ];
    }

    public function remote(): static
    {
        return $this->state(function (): array {
            $publicId = 'madfan/media/'.fake()->unique()->bothify('asset_????');

            return [
                'path' => 'https://res.cloudinary.com/test-cloud/image/upload/v1/'.$publicId.'.jpg',
                'cloudinary_public_id' => $publicId,
            ];
        });
    }

    public function generated(?string $prompt = null): static
    {
        return $this->remote()->state(fn (): array => [
            'source' => MediaAssetSource::Generated,
            'prompt' => $prompt ?? fake()->sentence(8),
            'title' => 'Generated kit shot',
        ]);
    }

    public function forUploader(User $user): static
    {
        return $this->state(fn (): array => [
            'uploaded_by' => $user->id,
        ]);
    }
}
