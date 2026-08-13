<?php

namespace App\Enums;

enum JerseySize: string
{
    case Xs = 'XS';
    case S = 'S';
    case M = 'M';
    case L = 'L';
    case Xl = 'XL';
    case Xxl = 'XXL';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $size): string => $size->value, self::cases());
    }
}
