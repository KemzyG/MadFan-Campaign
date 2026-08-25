<?php

namespace App\Models;

use App\Actions\Social\CreateSocialNotification;
use App\Enums\EventType;
use App\Support\PublicStorageUrl;
use Database\Factories\SocialAnnouncementFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An editorially-authored entry on the Social events feed — the three kinds
 * (concert, song release, breaking news) that no other model can supply.
 *
 * Kind-specific fields live in `meta`: concerts carry `artist`/`venue`,
 * releases carry `artist`/`track`/`album`, news carries `source`/`is_urgent`.
 */
class SocialAnnouncement extends Model
{
    /** @use HasFactory<SocialAnnouncementFactory> */
    use HasFactory;

    protected $fillable = [
        'type',
        'club_id',
        'headline',
        'subtitle',
        'image_path',
        'link_url',
        'link_label',
        'meta',
        'is_pinned',
        'starts_at',
        'ends_at',
        'published_at',
    ];

    /**
     * A published-on-creation announcement notifies every fan immediately —
     * this is the one event source with a genuine single authoring point
     * (see class docblock); scheduled/future `published_at` rows don't
     * notify here since nothing currently detects that transition later.
     */
    protected static function booted(): void
    {
        static::created(function (SocialAnnouncement $announcement): void {
            if ($announcement->published_at === null || $announcement->published_at->isFuture()) {
                return;
            }

            $recipients = User::query()->fanAccounts()->get();

            app(CreateSocialNotification::class)->notifyMany(
                $recipients,
                SocialNotification::TYPE_ANNOUNCEMENT,
                $announcement,
                [
                    'headline' => $announcement->headline,
                    'link_url' => $announcement->link_url,
                ],
            );
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => EventType::class,
            'meta' => 'array',
            'is_pinned' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * @param  Builder<SocialAnnouncement>  $query
     * @return Builder<SocialAnnouncement>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Not yet expired: either open-ended, or `ends_at` still ahead of now.
     *
     * @param  Builder<SocialAnnouncement>  $query
     * @return Builder<SocialAnnouncement>
     */
    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where(function (Builder $inner): void {
            $inner->whereNull('ends_at')->orWhere('ends_at', '>=', now());
        });
    }

    /** Null (rather than the placeholder thumbnail) when no image was set. */
    public function imageUrl(): ?string
    {
        return filled($this->image_path) ? PublicStorageUrl::path($this->image_path) : null;
    }

    /**
     * A `meta` value, with the JSON column's untyped-ness contained here.
     */
    public function meta(string $key, mixed $default = null): mixed
    {
        return data_get($this->meta, $key, $default);
    }
}
