<?php

namespace App\Enums;

enum SocialPlatform: string
{
    case X = 'x';
    case Discord = 'discord';
    case Telegram = 'telegram';

    /**
     * @return list<self>
     */
    public static function required(): array
    {
        return [self::X, self::Discord];
    }

    /**
     * @return list<self>
     */
    public static function optional(): array
    {
        return [self::Telegram];
    }

    public function label(): string
    {
        return match ($this) {
            self::X => 'X (Twitter)',
            self::Discord => 'Discord',
            self::Telegram => 'Telegram',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::X => '𝕏',
            self::Discord => '🎮',
            self::Telegram => '✈️',
        };
    }

    public static function fromTaskPlatform(?string $platform): ?self
    {
        return match (strtolower($platform ?? '')) {
            'x', 'twitter' => self::X,
            'discord' => self::Discord,
            'telegram' => self::Telegram,
            default => null,
        };
    }
}
