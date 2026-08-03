<?php

namespace App\Support;

use Illuminate\Http\Request;

class AdminRouting
{
    public static function filamentDomain(): ?string
    {
        $domain = config('admin.filament_domain');

        return filled($domain) ? (string) $domain : null;
    }

    public static function appDomain(): ?string
    {
        $domain = config('admin.app_domain');

        return filled($domain) ? (string) $domain : null;
    }

    public static function filamentPath(): string
    {
        return trim((string) config('admin.filament_path', 'admin'), '/') ?: 'admin';
    }

    /**
     * Inertia admin URL prefix without leading/trailing slashes.
     *
     * Empty string means the console is mounted at the host root
     * (typical when ADMIN_DOMAIN is set, e.g. https://mod.example.com/).
     */
    public static function appPath(): string
    {
        return trim((string) config('admin.app_path', 'app'), '/');
    }

    /**
     * Shared / meta base path for the frontend ("" or "/app").
     */
    public static function appPathPrefix(): string
    {
        $path = self::appPath();

        return $path === '' ? '' : '/'.$path;
    }

    /**
     * Absolute path under the Inertia admin mount.
     */
    public static function absoluteAppPath(string $suffix = ''): string
    {
        $base = self::appPath();
        $suffix = trim($suffix, '/');

        if ($base === '' && $suffix === '') {
            return '/';
        }

        if ($base === '') {
            return '/'.$suffix;
        }

        if ($suffix === '') {
            return '/'.$base;
        }

        return '/'.$base.'/'.$suffix;
    }

    public static function isOnAppDomain(Request $request): bool
    {
        $domain = self::appDomain();

        return $domain !== null && strcasecmp($request->getHost(), $domain) === 0;
    }

    public static function isAdminAppPath(Request $request): bool
    {
        $path = self::appPath();

        if ($path === '') {
            return self::isOnAppDomain($request);
        }

        return $request->is($path, $path.'/*');
    }

    /**
     * Fan-only paths that must never render on the admin host.
     *
     * @return list<string>
     */
    public static function fanOnlyPaths(): array
    {
        return [
            'passport',
            'passport/*',
            'daily-claim',
            'daily-claim/*',
            'connect-accounts',
            'connect-accounts/*',
            'connect/*',
            'register',
            'waitlist',
            'r/*',
            'roadmap',
            'region',
            'team',
            'about',
            'whitepaper',
        ];
    }

    public static function isFanOnlyPath(Request $request): bool
    {
        return $request->is(...self::fanOnlyPaths());
    }

    /**
     * Livewire endpoints (hashed prefix like /livewire-8a72d594/* plus legacy /livewire/*).
     */
    public static function isLivewirePath(Request $request): bool
    {
        return $request->is(
            'livewire',
            'livewire/*',
            'livewire-*',
            'livewire-*/*',
            'vendor/livewire',
            'vendor/livewire/*',
        );
    }

    public static function isInertiaAdminRequest(Request $request): bool
    {
        if (self::isAdminAppPath($request)) {
            return true;
        }

        return self::isOnAppDomain($request);
    }

    /**
     * Absolute URL on the fan site (APP_URL), used when bouncing off the admin host.
     */
    public static function fanSiteUrl(string $path = '/'): string
    {
        $base = rtrim((string) config('app.url'), '/');
        $suffix = '/'.ltrim($path, '/');

        if ($suffix === '/') {
            return $base.'/';
        }

        return $base.$suffix;
    }

    public static function isFilamentRequest(Request $request): bool
    {
        $path = self::filamentPath();

        if ($request->is($path, $path.'/*')) {
            return true;
        }

        $domain = self::filamentDomain();

        return $domain !== null && strcasecmp($request->getHost(), $domain) === 0;
    }

    public static function isAdminSurface(Request $request): bool
    {
        return self::isInertiaAdminRequest($request) || self::isFilamentRequest($request);
    }
}
