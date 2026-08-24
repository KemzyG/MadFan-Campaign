<?php

use App\Actions\Social\AwardSocialPoints;
use App\Models\Club;

test('social wallet requires authentication', function () {
    $this->get('/social/wallet')->assertRedirect(route('login'));
});

test('wallet shows balance loyalty breakdown stats and activity', function () {
    $club = Club::factory()->create(['name' => 'Wallet FC']);
    $user = socialReadyUser($club);
    $user->forceFill(['current_streak_days' => 6, 'best_streak_days' => 9])->save();

    // Earn points through the real award flow (avoids the stale ledger factory).
    $this->actingAs($user)
        ->post('/social/posts', ['body' => 'First post into the wallet'])
        ->assertRedirect(route('social.feed'));

    $points = AwardSocialPoints::RULES[AwardSocialPoints::SOURCE_POST]['points'];

    expect((int) $user->fresh()->total_points)->toBe($points);

    $this->actingAs($user)
        ->get(route('social.wallet'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Wallet/Index')
            ->where('balance.total_points', $points)
            ->where('balance.total_earned', $points)
            ->where('balance.currency_label', 'Fan points')
            ->where('loyalty.max', 1000)
            ->has('loyalty.score')
            ->has('loyalty.grade')
            ->where('loyalty.components.user.available', true)
            ->where('breakdown.0.key', 'posting')
            ->where('breakdown.0.points', $points)
            ->where('breakdown.0.percent', 100)
            ->where('stats.posting_points', $points)
            ->where('stats.posts_published', 1)
            ->where('stats.replies_posted', 0)
            ->has('activity', 1)
            ->where('activity.0.amount', $points)
            ->where('activity.0.source_type', AwardSocialPoints::SOURCE_POST));
});

test('wallet renders an empty breakdown for a fan with no points', function () {
    $user = socialReadyUser();

    $this->actingAs($user)
        ->get(route('social.wallet'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Wallet/Index')
            ->where('balance.total_points', 0)
            ->has('breakdown', 0)
            ->has('activity', 0)
            ->where('stats.posting_points', 0));
});
