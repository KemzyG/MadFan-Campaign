<?php

namespace App\Support;

use Illuminate\Http\Request;

class SocialRouting
{
    public static function isSocialRequest(Request $request): bool
    {
        return $request->is('social') || $request->is('social/*');
    }
}
