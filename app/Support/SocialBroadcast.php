<?php

namespace App\Support;

use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Support\Facades\Log;
use Throwable;

class SocialBroadcast
{
    /**
     * Run a broadcast dispatch without failing the HTTP request when Reverb is
     * misconfigured or temporarily unavailable (Inertia poll remains the fallback).
     */
    public static function try(callable $dispatch): void
    {
        try {
            $dispatch();
        } catch (BroadcastException $exception) {
            Log::warning('Social broadcast skipped: Reverb unavailable.', [
                'message' => $exception->getMessage(),
            ]);
        } catch (Throwable $exception) {
            if (! self::isBroadcastTransportFailure($exception)) {
                throw $exception;
            }

            Log::warning('Social broadcast skipped: transport failure.', [
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private static function isBroadcastTransportFailure(Throwable $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'failed to connect')
            || str_contains($message, 'could not connect')
            || str_contains($message, 'connection refused')
            || str_contains($message, 'pusher error');
    }
}
