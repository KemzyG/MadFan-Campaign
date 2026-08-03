<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Facades\Log;

class LogFailedAuthentication
{
    public function handle(Failed $event): void
    {
        Log::warning('Authentication failed.', [
            'guard' => $event->guard,
            'email' => is_array($event->credentials) ? ($event->credentials['email'] ?? null) : null,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
