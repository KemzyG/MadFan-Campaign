<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DailyClaimController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\PassportController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WaitlistController;
use Illuminate\Support\Facades\Route;

Route::middleware('app.maintenance')->group(function () {
    // --------------------------------------------------------------------------
    // Auth routes (public)
    // --------------------------------------------------------------------------
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    // Route::post('/auth/firebase', [AuthController::class, 'firebaseLogin']);
    // Route::post('/auth/firebase/register', [AuthController::class, 'firebaseRegister']);

    // --------------------------------------------------------------------------
    // Waitlist (public)
    // --------------------------------------------------------------------------
    Route::post('/waitlist', [WaitlistController::class, 'store'])->middleware('throttle:waitlist');
    Route::get('/waitlist/count', [WaitlistController::class, 'count'])->middleware('throttle:waitlist');

    // --------------------------------------------------------------------------
    // Protected routes (require Paseto token)
    // --------------------------------------------------------------------------
    Route::middleware('auth.paseto')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::post('/device-token', [DeviceTokenController::class, 'store']);
        Route::delete('/device-token', [DeviceTokenController::class, 'destroy']);

        Route::middleware('verified')->group(function () {
            Route::get('/tasks', [TaskController::class, 'index']);
            Route::post('/tasks/{task}/confirm', [TaskController::class, 'confirm']);
            Route::post('/tasks/{task}/claim', [TaskController::class, 'claim']);

            Route::get('/daily-claim', [DailyClaimController::class, 'show']);
            Route::post('/daily-claim', [DailyClaimController::class, 'claim']);

            Route::get('/passport', [PassportController::class, 'show']);
            Route::patch('/passport', [PassportController::class, 'update'])->middleware('throttle:passport-update');

            Route::get('/referrals', [ReferralController::class, 'index']);
            Route::post('/referrals/claim-milestone', [ReferralController::class, 'claimMilestone']);

            Route::get('/leaderboard', [LeaderboardController::class, 'index']);
        });
    });
});
