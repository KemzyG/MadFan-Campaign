<?php

namespace App\Support;

use Illuminate\Http\Request;

class SocialRouting
{
    public static function domain(): ?string
    {
        $domain = config('domains.social');

        return filled($domain) ? strtolower((string) $domain) : null;
    }

    public static function usesSubdomain(): bool
    {
        return self::domain() !== null;
    }

    /**
     * URL path prefix for the social surface ("" on subdomain, "/social" otherwise).
     */
    public static function pathPrefix(): string
    {
        return self::usesSubdomain() ? '' : '/social';
    }

    /**
     * Absolute path under the social mount (canonical / clean URL).
     */
    public static function absolutePath(string $suffix = ''): string
    {
        $suffix = trim($suffix, '/');
        $base = self::pathPrefix();

        if ($base === '' && $suffix === '') {
            return '/';
        }

        if ($base === '') {
            return '/'.$suffix;
        }

        if ($suffix === '') {
            return $base;
        }

        return $base.'/'.$suffix;
    }

    /**
     * Origin for the social host (scheme + host), or empty when same-host path mode.
     */
    public static function origin(): string
    {
        $domain = self::domain();

        if ($domain === null) {
            return '';
        }

        $root = parse_url((string) config('app.url'), PHP_URL_SCHEME) ?: 'https';

        return $root.'://'.$domain;
    }

    /**
     * Absolute URL on the social surface.
     */
    public static function url(string $path = '/'): string
    {
        $path = '/'.ltrim($path, '/');
        if ($path === '/') {
            $path = self::absolutePath();
        } elseif (self::usesSubdomain()) {
            // Strip legacy /social prefix when building subdomain URLs.
            if (str_starts_with($path, '/social/') || $path === '/social') {
                $path = $path === '/social' ? '/' : substr($path, strlen('/social'));
            }
        } elseif (! str_starts_with($path, '/social')) {
            $path = self::absolutePath(ltrim($path, '/'));
        }

        $origin = self::origin();

        if ($origin === '') {
            $base = rtrim((string) config('app.url'), '/');

            return $path === '/' ? $base.'/' : $base.$path;
        }

        return $path === '/' ? $origin.'/' : $origin.$path;
    }

    public static function isOnSocialDomain(Request $request): bool
    {
        $domain = self::domain();

        return $domain !== null && strcasecmp($request->getHost(), $domain) === 0;
    }

    public static function isSocialRequest(Request $request): bool
    {
        if (self::isOnSocialDomain($request)) {
            return true;
        }

        return $request->is('social') || $request->is('social/*');
    }

    /**
     * Shared Inertia / meta props for frontend URL helpers.
     *
     * @return array{path: string, origin: string, subdomain: bool}
     */
    public static function frontendConfig(): array
    {
        return [
            'path' => self::pathPrefix(),
            'origin' => self::origin(),
            'subdomain' => self::usesSubdomain(),
        ];
    }
}
