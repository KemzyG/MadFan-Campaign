<?php

namespace App\Models;

use App\Enums\MediaAssetSource;
use App\Support\PublicStorageUrl;
use Database\Factories\MediaAssetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MediaAsset extends Model
{
    /** @use HasFactory<MediaAssetFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'alt_text',
        'path',
        'cloudinary_public_id',
        'source',
        'prompt',
        'mime_type',
        'bytes',
        'width',
        'height',
        'uploaded_by',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'source' => MediaAssetSource::class,
            'bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function jerseys(): BelongsToMany
    {
        return $this->belongsToMany(Jersey::class)
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    public function getUrlAttribute(): string
    {
        return PublicStorageUrl::path($this->path);
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'alt_text' => $this->alt_text,
            'path' => $this->path,
            'url' => $this->url,
            'cloudinary_public_id' => $this->cloudinary_public_id,
            'source' => $this->source->value,
            'source_label' => $this->source->label(),
            'prompt' => $this->prompt,
            'mime_type' => $this->mime_type,
            'bytes' => $this->bytes,
            'width' => $this->width,
            'height' => $this->height,
            'uploaded_by' => $this->uploaded_by,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{id: int, url: string, alt: string|null, title: string|null}
     */
    public function toShopImage(): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'alt' => $this->alt_text ?: $this->title,
            'title' => $this->title,
        ];
    }
}
