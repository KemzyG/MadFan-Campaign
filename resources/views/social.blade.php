<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#000000">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name') }} Social</title>
    <link rel="icon" href="{{ asset('favicon.jpg') }}" type="image/jpeg">
    <link rel="apple-touch-icon" href="{{ asset('favicon.jpg') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    {{-- Mad Fan Social: Saira Condensed (stadium/broadcast display) + IBM Plex Sans (readable terrace body) + IBM Plex Mono (handles / MRZ / stats) --}}
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Saira+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
    @inertiaHead
    @viteReactRefresh
    @vite(['resources/css/social.css', 'resources/js/social.jsx'])
</head>
<body class="mf-social antialiased">
    @inertia
</body>
</html>
