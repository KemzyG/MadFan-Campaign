<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#ffffff">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name') }} Social</title>
    <link rel="icon" href="{{ asset('favicon.jpg') }}" type="image/jpeg">
    <link rel="apple-touch-icon" href="{{ asset('favicon.jpg') }}">
    @php($madfanReverb = \App\Support\SocialRealtime::echoClientConfig())
    @if ($madfanReverb)
        <script>
            window.__MADFAN_REVERB__ = @json($madfanReverb);
        </script>
    @endif
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    {{-- Vibrants: Fraunces (editorial serif display, >=20px) + Inter (UI/body below 20px) + Montserrat (uppercase tracked labels) + Bebas Neue (badges / discount pills only) + IBM Plex Mono (MRZ / ledger / codes) --}}
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fraunces:opsz,wght@9..144,400..700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400..700&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet">
    @inertiaHead
    @viteReactRefresh
    @vite(['resources/css/social.css', 'resources/js/social.jsx'])
</head>
<body class="mf-social antialiased">
    @inertia
</body>
</html>
