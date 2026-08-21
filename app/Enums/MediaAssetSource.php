<?php

namespace App\Enums;

enum MediaAssetSource: string
{
    case Upload = 'upload';
    case Generated = 'generated';
    case Url = 'url';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $case): string => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Upload => 'Uploaded',
            self::Generated => 'AI generated',
            self::Url => 'Remote URL',
        };
    }
}
