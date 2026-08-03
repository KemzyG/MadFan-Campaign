<?php

namespace App\Http\Middleware;

use App\Services\PasetoService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PasetoAuthenticate
{
    protected PasetoService $pasetoService;

    public function __construct(PasetoService $pasetoService)
    {
        $this->pasetoService = $pasetoService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $header = $request->header('Authorization');

        if ($header && str_starts_with($header, 'Bearer ')) {
            $token = substr($header, 7);
            $userId = $this->pasetoService->validateToken($token);

            if (! $userId) {
                return response()->json(['message' => 'Invalid token.'], 401);
            }

            Auth::onceUsingId($userId);

            return $next($request);
        }

        if (Auth::check()) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthenticated.'], 401);
    }
}
