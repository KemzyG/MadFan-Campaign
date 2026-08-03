<?php

namespace App\Support;

class MaskedEmail
{
    /**
     * Mask an email for public display, e.g. mikeu@gmail.com → m***u@gmail.com.
     */
    public static function from(?string $email): ?string
    {
        if (blank($email) || ! str_contains($email, '@')) {
            return $email;
        }

        [$local, $domain] = explode('@', $email, 2);
        $local = (string) $local;
        $domain = (string) $domain;

        if ($local === '') {
            return '***@'.$domain;
        }

        if (strlen($local) === 1) {
            return $local.'***@'.$domain;
        }

        if (strlen($local) === 2) {
            return $local[0].'***'.$local[1].'@'.$domain;
        }

        $maskLength = max(3, strlen($local) - 2);

        return $local[0].str_repeat('*', $maskLength).$local[strlen($local) - 1].'@'.$domain;
    }
}
