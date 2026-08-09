<?php

namespace App\Models;

use App\Enums\MatchTicketStatus;
use Database\Factories\MatchTicketFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class MatchTicket extends Model
{
    /** @use HasFactory<MatchTicketFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'match_fixture_id',
        'status',
        'price',
        'section',
        'seat',
        'code',
        'purchased_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => MatchTicketStatus::class,
            'price' => 'decimal:2',
            'purchased_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function matchFixture(): BelongsTo
    {
        return $this->belongsTo(MatchFixture::class);
    }

    public function qrPayload(): string
    {
        return 'madfan:ticket:'.$this->code;
    }

    public static function generateCode(): string
    {
        do {
            $code = 'MF'.Str::upper(Str::random(10));
        } while (self::query()->where('code', $code)->exists());

        return $code;
    }
}
