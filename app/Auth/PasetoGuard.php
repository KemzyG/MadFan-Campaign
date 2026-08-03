<?php

namespace App\Auth;

use App\Models\User;
use App\Services\PasetoService;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PasetoGuard implements Guard
{
    protected PasetoService $pasetoService;

    protected ?User $user = null;

    protected Request $request;

    public function __construct(PasetoService $pasetoService, Request $request)
    {
        $this->pasetoService = $pasetoService;
        $this->request = $request;
    }

    public function user()
    {
        if ($this->user) {
            return $this->user;
        }
        $token = $this->getTokenFromHeader();
        if (! $token) {
            return null;
        }
        $userId = $this->pasetoService->validateToken($token);
        if ($userId) {
            $this->user = User::find($userId);
        }

        return $this->user;
    }

    protected function getTokenFromHeader(): ?string
    {
        $header = $this->request->header('Authorization');
        if (! $header) {
            return null;
        }
        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }

    public function check()
    {
        return $this->user() !== null;
    }

    public function id()
    {
        return $this->user()?->getAuthIdentifier();
    }

    public function validate(array $credentials = [])
    {
        // Not used – token‑based auth only.
        return false;
    }

    public function setUser($user)
    {
        $this->user = $user;
    }
}
