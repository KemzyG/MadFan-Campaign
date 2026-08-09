<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="admin-path" content="{{ \App\Support\AdminRouting::appPathPrefix() }}">
    <title>Admin Panel – {{ config('app.name') }}</title>
    <link rel="icon" href="{{ asset('favicon.jpg') }}" type="image/jpeg">
    <link rel="apple-touch-icon" href="{{ asset('favicon.jpg') }}">
    @inertiaHead
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/admin.jsx'])
</head>
<body class="antialiased">
    @inertia
</body>
</html>
