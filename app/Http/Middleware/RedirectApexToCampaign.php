<?php

namespace App\Http\Middleware;

use App\Support\CampaignRouting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * When APP_DOMAIN + CAMPAIGN_DOMAIN are set, bounce apex/www to the campaign host.
 */
class RedirectApexToCampaign
{
    public function handle(Request $request, Closure $next): Response
    {
        if (CampaignRouting::domain() === null || CampaignRouting::rootDomain() === null) {
            return $next($request);
        }

        if (! CampaignRouting::isApexRequest($request)) {
            return $next($request);
        }

        // Health checks and static assets can stay on apex if pointed there.
        if ($request->is('up', 'up/*', 'storage', 'storage/*', 'build', 'build/*')) {
            return $next($request);
        }

        $target = CampaignRouting::url($request->getRequestUri());

        return redirect()->away($target, 301);
    }
}
