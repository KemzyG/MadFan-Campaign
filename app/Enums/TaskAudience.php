<?php

namespace App\Enums;

enum TaskAudience: string
{
    case Fan = 'fan';
    case Staff = 'staff';

    public function label(): string
    {
        return match ($this) {
            self::Fan => 'Fan Campaign',
            self::Staff => 'Staff Assignment',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
