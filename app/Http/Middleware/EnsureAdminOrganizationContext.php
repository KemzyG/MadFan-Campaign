<?php

namespace App\Http\Middleware;

use App\Services\Admin\AdminOrganizationContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrganizationContext
{
    public function __construct(private AdminOrganizationContext $organizationContext) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null) {
            $this->organizationContext->bootstrap($user, $request->session());
        }

        return $next($request);
    }
}
