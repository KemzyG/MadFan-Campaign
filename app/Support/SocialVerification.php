<?php

namespace App\Support;

class SocialVerification
{
    public static function allowsMockWhenCredentialsMissing(): bool
    {
        return (bool) config('services.social.allow_mock_verification', false);
    }
}
