<?php

use App\Support\SurfaceRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Tests\TestCase;

uses(TestCase::class);

test('isCrossOrigin distinguishes hosts and ignores relative urls', function () {
    $request = Request::create('https://madfan.test/login', 'POST');

    expect(SurfaceRedirect::isCrossOrigin($request, 'https://social.madfan.test/'))->toBeTrue()
        ->and(SurfaceRedirect::isCrossOrigin($request, 'https://madfan.test/dashboard'))->toBeFalse()
        ->and(SurfaceRedirect::isCrossOrigin($request, 'https://MADFAN.TEST/x'))->toBeFalse()
        ->and(SurfaceRedirect::isCrossOrigin($request, '/relative/path'))->toBeFalse();
});

test('to() hands Inertia a hard-visit 409 when crossing origins', function () {
    $request = Request::create('https://madfan.test/login', 'POST', server: ['HTTP_X_INERTIA' => 'true']);
    $this->app->instance('request', $request);

    $response = SurfaceRedirect::to($request, 'https://social.madfan.test/');

    expect($response->getStatusCode())->toBe(409)
        ->and($response->headers->get('X-Inertia-Location'))->toBe('https://social.madfan.test/');
});

test('to() stays a normal redirect within the same origin', function () {
    $request = Request::create('https://madfan.test/login', 'POST', server: ['HTTP_X_INERTIA' => 'true']);
    $this->app->instance('request', $request);

    $response = SurfaceRedirect::to($request, 'https://madfan.test/dashboard');

    expect($response)->toBeInstanceOf(RedirectResponse::class)
        ->and($response->getTargetUrl())->toBe('https://madfan.test/dashboard');
});

test('intended() consumes the stored url and still crosses origins safely', function () {
    $request = Request::create('https://madfan.test/login', 'POST', server: ['HTTP_X_INERTIA' => 'true']);
    $request->setLaravelSession($this->app['session']->driver('array'));
    $request->session()->put('url.intended', 'https://social.madfan.test/passport');
    $this->app->instance('request', $request);

    $response = SurfaceRedirect::intended($request, 'https://social.madfan.test/');

    expect($response->getStatusCode())->toBe(409)
        ->and($response->headers->get('X-Inertia-Location'))->toBe('https://social.madfan.test/passport')
        ->and($request->session()->has('url.intended'))->toBeFalse();
});
