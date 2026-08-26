<?php

namespace App\Enums;

enum ProductType: string
{
    case Apparel = 'apparel';
    case Collectible = 'collectible';
    case Subscription = 'subscription';

    public function label(): string
    {
        return match ($this) {
            self::Apparel => 'Apparel',
            self::Collectible => 'Collectibles',
            self::Subscription => 'Subscriptions',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $type): string => $type->value, self::cases());
    }
}
