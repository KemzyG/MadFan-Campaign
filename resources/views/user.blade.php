<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name') }}</title>
    <link rel="icon" href="{{ asset('favicon.jpg') }}" type="image/jpeg">
    <link rel="apple-touch-icon" href="{{ asset('favicon.jpg') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    @inertiaHead
    @viteReactRefresh
    @vite(['resources/css/madfan.css', 'resources/js/user.jsx'])
</head>
<body>
    @inertia
</body>
</html>
