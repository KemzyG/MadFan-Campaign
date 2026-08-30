<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN', false);
        $response->headers->set('X-Content-Type-Options', 'nosniff', false);
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin', false);
        $response->headers->set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()', false);
        $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy(), false);

        if ($request->secure() && app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains', false);
        }

        return $response;
    }

    private function contentSecurityPolicy(): string
    {
        $scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
        $styleSrc = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'];
        $connectSrc = ["'self'", 'https:', 'wss:'];
        $fontSrc = ["'self'", 'data:', 'https://fonts.gstatic.com'];
        $imgSrc = ["'self'", 'data:', 'blob:', 'https:'];
        $mediaSrc = ["'self'", 'blob:', 'https:'];
        // Vite HMR / React Refresh create blob: workers; without worker-src they
        // fall back to script-src and browsers block blob: construction.
        $workerSrc = ["'self'", 'blob:'];

        if ($this->allowsViteDevServer()) {
            $viteOrigins = $this->viteDevOrigins();
            $wsOrigins = array_map(
                static fn (string $origin): string => (string) preg_replace('#^http#i', 'ws', $origin),
                $viteOrigins,
            );

            $scriptSrc = array_merge($scriptSrc, $viteOrigins);
            $styleSrc = array_merge($styleSrc, $viteOrigins);
            $connectSrc = array_merge($connectSrc, $viteOrigins, $wsOrigins);
            $fontSrc = array_merge($fontSrc, $viteOrigins);
            $imgSrc = array_merge($imgSrc, $viteOrigins);
            $mediaSrc = array_merge($mediaSrc, $viteOrigins);
            $workerSrc = array_merge($workerSrc, $viteOrigins);
        }

        $connectSrc = array_merge($connectSrc, $this->reverbConnectOrigins());

        return implode('; ', [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            'img-src '.implode(' ', array_unique($imgSrc)),
            'media-src '.implode(' ', array_unique($mediaSrc)),
            'font-src '.implode(' ', array_unique($fontSrc)),
            'style-src '.implode(' ', array_unique($styleSrc)),
            'script-src '.implode(' ', array_unique($scriptSrc)),
            'worker-src '.implode(' ', array_unique($workerSrc)),
            'connect-src '.implode(' ', array_unique($connectSrc)),
            "object-src 'none'",
        ]);
    }

    private function allowsViteDevServer(): bool
    {
        return app()->environment('local');
    }

    /**
     * Origins used by `npm run dev` / `@vite`. Prefer the live `public/hot` URL
     * (normalized away from IPv6 bracket hosts browsers reject in CSP), plus
     * localhost / 127.0.0.1 fallbacks. Never emit `[::1]` CSP sources.
     *
     * @return list<string>
     */
    private function viteDevOrigins(): array
    {
        $origins = [];

        $hotPath = public_path('hot');
        if (is_readable($hotPath)) {
            $hotUrl = $this->normalizeViteOrigin(trim((string) file_get_contents($hotPath)));
            if ($hotUrl !== null) {
                $origins[] = $hotUrl;
            }
        }

        foreach (['localhost', '127.0.0.1'] as $host) {
            foreach ([5173, 5174] as $port) {
                $origins[] = "http://{$host}:{$port}";
            }
        }

        return array_values(array_unique($origins));
    }

    /**
     * Browsers ignore bracketed IPv6 hosts in CSP source lists. Map `[::1]` to
     * `127.0.0.1` so Vite HMR origins remain usable when `public/hot` still
     * contains an IPv6 loopback URL.
     */
    private function normalizeViteOrigin(string $url): ?string
    {
        $url = rtrim($url, '/');

        if ($url === '' || preg_match('#^https?://#i', $url) !== 1) {
            return null;
        }

        $normalized = preg_replace('#^(https?://)\[::1\]#i', '${1}127.0.0.1', $url);

        return is_string($normalized) ? $normalized : $url;
    }

    /**
     * Allow Laravel Echo / Reverb WebSocket endpoints in connect-src.
     * Local HTTP apps connect to ws://host:port; HTTPS production uses same-origin wss (self).
     *
     * @return list<string>
     */
    private function reverbConnectOrigins(): array
    {
        if (config('broadcasting.default') !== 'reverb') {
            return [];
        }

        $options = config('broadcasting.connections.reverb.options', []);
        $host = trim((string) ($options['host'] ?? ''));
        $port = (int) ($options['port'] ?? 8080);
        $scheme = strtolower((string) ($options['scheme'] ?? 'http'));

        $origins = [];
        $loopbackHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        $isLoopbackHost = $host === '' || in_array(strtolower($host), $loopbackHosts, true);

        if ($host !== '' && ! $isLoopbackHost) {
            $wsScheme = $scheme === 'https' ? 'wss' : 'ws';
            $origins[] = "{$wsScheme}://{$host}:{$port}";
        }

        if ($this->allowsViteDevServer() || app()->environment('local')) {
            foreach (['localhost', '127.0.0.1'] as $loopback) {
                $origins[] = "ws://{$loopback}:{$port}";
                $origins[] = "wss://{$loopback}:{$port}";
            }
        }

        return array_values(array_unique($origins));
    }
}
