<?php

use App\Models\PointTransaction;
use App\Models\Task;
use App\Models\UserTaskProgress;

test('guests are redirected from the fan dashboard', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated fans can view earnings dashboard', function () {
    $user = createUser([
        'total_points' => 1250,
        'current_streak_days' => 4,
        'best_streak_days' => 9,
        'referral_count' => 2,
    ]);

    PointTransaction::query()->create([
        'user_id' => $user->id,
        'season_id' => null,
        'source_type' => 'daily_claim',
        'source_id' => now()->toDateString(),
        'amount' => 50,
        'balance_after' => 50,
        'reason' => 'Daily claim',
        'idempotency_key' => 'dash-daily-1',
    ]);

    PointTransaction::query()->create([
        'user_id' => $user->id,
        'season_id' => null,
        'source_type' => 'task',
        'source_id' => '1',
        'amount' => 100,
        'balance_after' => 150,
        'reason' => 'Task completed',
        'idempotency_key' => 'dash-task-1',
    ]);

    PointTransaction::query()->create([
        'user_id' => $user->id,
        'season_id' => null,
        'source_type' => 'referral',
        'source_id' => '1',
        'amount' => 500,
        'balance_after' => 650,
        'reason' => 'Referral bonus',
        'idempotency_key' => 'dash-ref-1',
    ]);

    $task = Task::query()->create([
        'code' => 'DASH_TASK_1',
        'name' => 'Dashboard Task',
        'description' => 'Test task',
        'points' => 100,
        'platform' => 'general',
        'task_type' => 'engagement',
        'is_active' => true,
        'display_order' => 1,
    ]);

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'claimed',
        'is_checked' => true,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Dashboard')
            ->where('summary.total_earned', 650)
            ->where('summary.balance', 1250)
            ->where('summary.total_points', 1250)
            ->where('summary.current_streak_days', 4)
            ->where('summary.referral_count', 2)
            ->where('summary.tasks_completed', 1)
            ->has('by_source', 3)
            ->has('recent_transactions', 3)
            ->has('daily_series', 7)
            ->has('fan'));
});

test('dashboard earnings are scoped to the authenticated fan', function () {
    $user = createUser(['total_points' => 100]);
    $other = createUser(['total_points' => 9999]);

    PointTransaction::query()->create([
        'user_id' => $user->id,
        'season_id' => null,
        'source_type' => 'bonus',
        'source_id' => 'week-1',
        'amount' => 100,
        'balance_after' => 100,
        'reason' => 'Week bonus',
        'idempotency_key' => 'dash-bonus-self',
    ]);

    PointTransaction::query()->create([
        'user_id' => $other->id,
        'season_id' => null,
        'source_type' => 'bonus',
        'source_id' => 'week-1',
        'amount' => 5000,
        'balance_after' => 5000,
        'reason' => 'Other user bonus',
        'idempotency_key' => 'dash-bonus-other',
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('summary.total_earned', 100)
            ->has('recent_transactions', 1)
            ->where('recent_transactions.0.amount', 100));
});
