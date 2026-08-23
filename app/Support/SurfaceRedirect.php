<?php

namespace App\Support;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Redirect helpers that stay correct when the campaign/fan and social surfaces
 * live on separate subdomains.
 *
 * Inertia follows a 302 over XHR, so a plain redirect to another origin dies in
 * the browser's CORS check and the visit silently fails. When the target host
 * differs from the current request host we hand Inertia a 409 + X-Inertia-Location
 * instead (via Inertia::location()), which triggers a full-page visit the browser
 * is allowed to make. For non-Inertia requests Inertia::location() degrades to a
 * normal away() redirect, so these helpers are safe everywhere.
 */
class SurfaceRedirect
{
    /**
     * Redirect to $url, doing a hard Inertia visit when it crosses to another host.
     */
    public static function to(Request $request, string $url): Response
    {
        return self::isCrossOrigin($request, $url)
            ? Inertia::location($url)
            : redirect()->to($url);
    }

    /**
     * Mirror redirect()->intended() but cross-origin safe.
     */
    public static function intended(Request $request, string $default): Response
    {
        $target = (string) $request->session()->pull('url.intended', $default);

        return self::to($request, $target);
    }

    /**
     * Whether $url points at a different host than the current request.
     */
    public static function isCrossOrigin(Request $request, string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);

        return $host !== null && strcasecmp($host, $request->getHost()) !== 0;
    }
}
