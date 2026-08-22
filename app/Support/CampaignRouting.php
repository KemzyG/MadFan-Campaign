<?php

namespace App\Support;

use Illuminate\Http\Request;

class CampaignRouting
{
    public static function domain(): ?string
    {
        $domain = config('domains.campaign');

        return filled($domain) ? strtolower((string) $domain) : null;
    }

    public static function rootDomain(): ?string
    {
        $domain = config('domains.root');

        return filled($domain) ? strtolower((string) $domain) : null;
    }

    public static function usesSubdomain(): bool
    {
        return self::domain() !== null;
    }

    public static function isOnCampaignDomain(Request $request): bool
    {
        $domain = self::domain();

        return $domain !== null && strcasecmp($request->getHost(), $domain) === 0;
    }

    /**
     * Apex / www hosts that should bounce to the campaign host.
     *
     * @return list<string>
     */
    public static function apexHosts(): array
    {
        $root = self::rootDomain();

        if ($root === null) {
            return [];
        }

        return [$root, 'www.'.$root];
    }

    public static function isApexRequest(Request $request): bool
    {
        $host = strtolower($request->getHost());

        return in_array($host, self::apexHosts(), true);
    }

    /**
     * Absolute URL on the campaign / fan surface.
     */
    public static function url(string $path = '/'): string
    {
        $domain = self::domain();
        $suffix = '/'.ltrim($path, '/');
        if ($suffix === '/') {
            $suffix = '/';
        }

        if ($domain === null) {
            $base = rtrim((string) config('app.url'), '/');

            return $suffix === '/' ? $base.'/' : $base.$suffix;
        }

        $scheme = parse_url((string) config('app.url'), PHP_URL_SCHEME) ?: 'https';

        return $suffix === '/' ? "{$scheme}://{$domain}/" : "{$scheme}://{$domain}{$suffix}";
    }

    /**
     * @return array{path: string, origin: string, subdomain: bool}
     */
    public static function frontendConfig(): array
    {
        $domain = self::domain();
        $origin = '';

        if ($domain !== null) {
            $scheme = parse_url((string) config('app.url'), PHP_URL_SCHEME) ?: 'https';
            $origin = $scheme.'://'.$domain;
        }

        return [
            'path' => '',
            'origin' => $origin,
            'subdomain' => self::usesSubdomain(),
        ];
    }
}
